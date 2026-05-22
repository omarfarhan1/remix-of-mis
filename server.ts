import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import cors from "cors";
import helmet from "helmet";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import crypto from "crypto";

dotenv.config();

// --- STARTUP VALIDATION ---
if (!process.env.GEMINI_API_KEY) {
  if (process.env.NODE_ENV === "production") {
    console.error("\n[FATAL] GEMINI_API_KEY is not set in production.\n");
    process.exit(1);
  }
  console.warn("\n[WARN] GEMINI_API_KEY is not set. AI endpoints will return 503; UI preview will still load.\n");
}
// --- TYPE DEFINITIONS ---
interface CachedItem {
  response: any;
  timestamp: number;
}

// --- CONSTANTS & CONFIG (Reliability Tuning) ---
const CACHE_TTL = 1000 * 60 * 60; // 1 hour
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 95000; // 95s (Heavy synthesis window)
const MAX_GLOBAL_CONCURRENCY = 50; 
const MAX_PER_CLIENT_CONCURRENCY = 5; 

// --- STATE (Ephemeral Orchestration Memory) ---
const aiCache = new Map<string, CachedItem>();
const pendingRequests = new Map<string, Promise<any>>();
const clientConcurrency = new Map<string, number>();

// Dead Letter Storage (Observer for terminal failures - Ephemeral)
const DEAD_LETTER_QUEUE: Array<{traceId: string, error: any, timestamp: number, context: any}> = [];

// Global Circuit Breaker State (Per-instance context)
const CIRCUIT_BREAKER = {
  gemini: { failures: 0, lastFailure: 0, isOpen: false, totalSuccess: 0 },
  openrouter: { failures: 0, lastFailure: 0, isOpen: false, totalSuccess: 0 }
};

const BREAKER_THRESHOLD = 15; // Failures before tripping
const BREAKER_COOLDOWN = 60000; // 1 minute

function checkBreaker(provider: 'gemini' | 'openrouter') {
  const state = CIRCUIT_BREAKER[provider];
  if (state.isOpen) {
    const timeSinceFailure = Date.now() - state.lastFailure;
    if (timeSinceFailure > BREAKER_COOLDOWN) {
      state.isOpen = false;
      state.failures = Math.floor(state.failures / 2); // Decay for Half-Open
      console.log(`[CircuitBreaker:${provider}] -> HALF-OPEN (Testing recovery)`);
      return true;
    }
    return false;
  }
  return true;
}

function recordFailure(provider: 'gemini' | 'openrouter', error: any, traceId: string) {
  const state = CIRCUIT_BREAKER[provider];
  state.failures++;
  state.lastFailure = Date.now();
  if (state.failures >= BREAKER_THRESHOLD) {
    state.isOpen = true;
    console.error(`[CircuitBreaker:${provider}] !!! OPENED !!! Trace: ${traceId}`);
  }
}

function recordSuccess(provider: 'gemini' | 'openrouter') {
  const state = CIRCUIT_BREAKER[provider];
  state.totalSuccess++;
  if (state.failures > 0) state.failures--;
}

function updateConcurrency(clientId: string, delta: number) {
  const current = clientConcurrency.get(clientId) || 0;
  const next = Math.max(0, current + delta);
  if (next === 0) clientConcurrency.delete(clientId);
  else clientConcurrency.set(clientId, next);
  return next;
}

function getCacheKey(systemPrompt: string, userMessage: string, model: string): string {
  const data = `${systemPrompt || ""}|${userMessage}|${model}`;
  return crypto.createHash("sha256").update(data).digest("hex");
}

async function backoff(attempt: number) {
  const base = Math.pow(2, attempt) * 1000;
  const jitter = Math.random() * 1000;
  await new Promise(resolve => setTimeout(resolve, base + jitter));
}

// Model Allowlist
const ALLOWED_MODELS = [
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash-preview-05-20",
  "gemini-1.5-flash",
  "gemini-1.5-pro",
  "openai/gpt-4o-mini",
  "openai/gpt-4o"
];

// Validation
const AIRequestSchema = z.object({
  systemPrompt: z.string().optional(),
  userMessage: z.string(),
  jsonResponse: z.boolean().optional(),
  model: z.string().refine(m => ALLOWED_MODELS.includes(m)).optional(),
});

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * CORE NEURAL CALL (Handles Fallbacks, Retries, Timeouts)
 */
async function callGemini(mode: 'generate' | 'stream' | 'chat', params: any, req: Request, res?: Response) {
  const traceId = (req.headers['x-neural-trace'] as string) || crypto.randomUUID().slice(0, 8);
  
  if (!checkBreaker('gemini')) {
    throw new Error(`Neural provider capacity reached (Circuit Breaker: OPEN). ID: ${traceId}`);
  }

  const modelPriority = ["gemini-2.0-flash", "gemini-2.0-flash-lite", "gemini-1.5-flash"];
  let lastError: any = null;
  let connectionAborted = false;

  const cleanup = () => { connectionAborted = true; };
  req.on('close', cleanup);

  try {
    for (const modelId of modelPriority) {
      if (connectionAborted) break;
      let attempts = 0;
      
      while (attempts < MAX_RETRIES) {
        if (connectionAborted) break;
        try {
          console.log(`[AI:Gemini:${traceId}] ${modelId} (Attempt ${attempts + 1})`);
          
          const withTimeout = async <T>(promise: Promise<T>): Promise<T> => {
            let timeoutId: NodeJS.Timeout;
            const timeout = new Promise<never>((_, reject) => 
              timeoutId = setTimeout(() => reject(new Error("Neural Timeout")), REQUEST_TIMEOUT_MS)
            );
            return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
          };

          const genModel = ai.getGenerativeModel({
            model: modelId,
            ...(params.systemPrompt ? { systemInstruction: params.systemPrompt } : {}),
          });

          if (mode === 'generate') {
            const result = await withTimeout(genModel.generateContent({
              contents: [{ role: 'user', parts: [{ text: params.userMessage }] }],
              generationConfig: { responseMimeType: params.jsonResponse ? "application/json" : "text/plain" }
            }));
            recordSuccess('gemini');
            return { text: result.response.text() || "" };
          } 
          
          if (mode === 'stream' && res) {
            const result = await genModel.generateContentStream({
              contents: [{ role: 'user', parts: [{ text: params.userMessage }] }]
            });

            for await (const chunk of result.stream) {
              if (connectionAborted) break;
              if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
            }

            if (connectionAborted) {
              res.end();
              return { streamAborted: true };
            }

            recordSuccess('gemini');
            res.write("data: [DONE]\n\n");
            return { streamCompleted: true };
          }

          if (mode === 'chat') {
            const chatModel = ai.getGenerativeModel({
              model: modelId,
              systemInstruction: params.systemPrompt,
            });
            const chat = chatModel.startChat({
              history: (params.history || []).map((h: any) => ({
                role: h.role === 'user' ? 'user' : 'model',
                parts: [{ text: h.content || h.text || "" }]
              })),
            });
            const chatResult = await withTimeout(chat.sendMessage(params.message));
            recordSuccess('gemini');
            return { text: chatResult.response.text() || "" };
          }
        } catch (err: any) {
          lastError = err;
          const errorLower = (err.message || String(err)).toLowerCase();
          const isQuota = err.status === 429 || errorLower.includes("429") || errorLower.includes("quota");
          
          if (isQuota || err.status === 503) {
            recordFailure('gemini', err, traceId);
            if (attempts < MAX_RETRIES) {
              attempts++;
              await backoff(attempts);
              continue;
            }
          }
          break; // Try next model in list
        }
      }
    }
  } finally {
    req.off('close', cleanup);
  }

  // Final Terminal Failure -> DLQ
  DEAD_LETTER_QUEUE.push({ traceId, error: lastError, timestamp: Date.now(), context: { provider: 'Gemini', mode } });
  if (DEAD_LETTER_QUEUE.length > 50) DEAD_LETTER_QUEUE.shift();

  throw new Error(`Neural capacity threshold reached. (Trace: ${traceId})`);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));
  app.use(express.json({ limit: '1mb' }));
  app.set('trust proxy', 1);

  // Rate limiting per IP
  const globalRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
  });

  const aiRateLimit = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    // Prefer the explicit client id header; fall back to the official IPv6-safe
    // helper from express-rate-limit so we don't trigger ERR_ERL_KEY_GEN_IPV6
    // when the request arrives over IPv6 (e.g. ::1 in local dev).
    keyGenerator: (req, res) => {
      const clientId = req.headers['x-client-id'];
      if (typeof clientId === 'string' && clientId.length > 0) return clientId;
      return ipKeyGenerator(req.ip ?? '');
    },
    message: { error: 'AI request rate limit exceeded. Please wait before retrying.' }
  });

  app.use(globalRateLimit);
  app.use('/api/ai', aiRateLimit);

  // Health & Monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", concurrency: pendingRequests.size, breakers: CIRCUIT_BREAKER });
  });

  // Main Orchestration Route
  app.post("/api/ai/generate", async (req, res, next) => {
    const traceId = crypto.randomUUID().slice(0, 8);
    const clientId = (req.headers['x-client-id'] as string) || req.ip || "unknown";
    res.setHeader('X-Neural-Trace', traceId);

    try {
      const { systemPrompt = "", userMessage, jsonResponse, model: requestedModel = "gemini-1.5-flash" } = AIRequestSchema.parse(req.body);

      // 1. Adaptive Backpressure Control
      const currentConcurrency = clientConcurrency.get(clientId) || 0;
      if (currentConcurrency >= MAX_PER_CLIENT_CONCURRENCY) {
        return res.status(429).json({ 
          error: "Concurrent synthesis limit reached for this session. Please await current task completion.", 
          traceId,
          type: "BACKPRESSURE_ADAPTIVE" 
        });
      }
      if (pendingRequests.size >= MAX_GLOBAL_CONCURRENCY) {
        return res.status(503).json({ 
          error: "Neural core at target capacity. Global queue threshold active.", 
          traceId,
          type: "SYSTEM_SATURATION" 
        });
      }

      // 2. Cache & Deduplication
      const cacheKey = getCacheKey(systemPrompt, userMessage, requestedModel);
      const cached = aiCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        res.setHeader('X-Cache-Hit', 'true');
        return res.json({ text: cached.response, cached: true });
      }

      if (pendingRequests.has(cacheKey)) {
        console.log(`[Deduplicator:${traceId}] Merging duplicate request for ${cacheKey}`);
        const resultText = await pendingRequests.get(cacheKey);
        return res.json({ text: resultText, cached: true });
      }

      // 3. Orchestration
      updateConcurrency(clientId, 1);
      const abortController = new AbortController();
      req.on('close', () => abortController.abort());

      const executeRequest = (async () => {
        let text = "";
        let fallbackToGemini = false;
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (apiKey && checkBreaker('openrouter')) {
          try {
            const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              signal: abortController.signal,
              headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Neural-Trace": traceId },
              body: JSON.stringify({
                model: requestedModel,
                messages: [...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []), { role: "user", content: userMessage }],
                response_format: jsonResponse ? { type: "json_object" } : undefined,
              })
            });
            if (!response.ok) throw new Error(`Status ${response.status}`);
            const data = await response.json();
            text = data.choices?.[0]?.message?.content || "";
            recordSuccess('openrouter');
          } catch (err: any) {
            if (err.name === 'AbortError') throw err;
            console.warn(`[Orchestrator:${traceId}] OpenRouter failure, fallback triggered.`);
            recordFailure('openrouter', err, traceId);
            fallbackToGemini = true;
          }
        } else fallbackToGemini = true;

        if (fallbackToGemini || !text) {
          req.headers['x-neural-trace'] = traceId;
          const result = await callGemini('generate', { systemPrompt, userMessage, jsonResponse }, req);
          text = ('text' in result ? result.text : "") ?? "";
        }

        if (text) aiCache.set(cacheKey, { response: text, timestamp: Date.now() });
        return text;
      })();

      pendingRequests.set(cacheKey, executeRequest);

      try { res.json({ text: await executeRequest }); } 
      finally { 
        pendingRequests.delete(cacheKey); 
        updateConcurrency(clientId, -1); 
      }

    } catch (error: any) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: "Schema Validation Error" });
      next(error);
    }
  });

  // Streaming Proxy
  app.post("/api/ai/stream", async (req, res, next) => {
    try {
      const { systemPrompt, userMessage } = AIRequestSchema.parse(req.body);
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      await callGemini('stream', { systemPrompt, userMessage }, req, res);
      res.end();
    } catch (error: any) { next(error); }
  });

  // Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || 500;
    res.status(status).json({ error: err.message || "Internal Server Error", traceId: req.headers['x-neural-trace'] });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running - Concurrency Caps ACTIVE (Global: ${MAX_GLOBAL_CONCURRENCY})`));
}

startServer();
