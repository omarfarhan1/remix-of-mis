import { z } from 'zod';

export const createAICache = async (params: {
  model?: string;
  systemPrompt: string;
  userMessage?: string;
  ttlSeconds?: number;
}) => {
  // Production should use Redis or persistent backend cache
  return null;
};

export const deleteAICache = async (cacheName: string) => {
  // No-op for now
};

export interface AIContentParams {
  systemPrompt?: string;
  userMessage: string;
  jsonResponse?: boolean;
  model?: string;
  tools?: any[];
  cachedContent?: string;
  schema?: z.ZodType<any>;
  signal?: AbortSignal;
}

const getClientId = () => {
  if (typeof window === 'undefined') return 'server';
  let id = localStorage.getItem('neural_client_id');
  if (!id) {
    id = `client_${Math.random().toString(36).slice(2)}_${Date.now()}`;
    localStorage.setItem('neural_client_id', id);
  }
  return id;
};

export const generateAIContent = async (params: AIContentParams) => {
  const internalController = new AbortController();
  
  // Link signals
  const cleanupSignal = () => {
    if (params.signal) {
      params.signal.removeEventListener('abort', abortInternal);
    }
  };

  const abortInternal = () => internalController.abort();
  if (params.signal) {
    if (params.signal.aborted) return Promise.reject(new DOMException("The operation was aborted", "AbortError"));
    params.signal.addEventListener('abort', abortInternal);
  }

  // Adaptive Timeout: Critical for long-form strategic synthesis
  const timeoutId = setTimeout(() => {
    internalController.abort();
  }, 95000); 

  try {
    let attempt = 0;
    const maxInternalRetries = 2;

    while (attempt < maxInternalRetries) {
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Client-ID": getClientId()
          },
          signal: internalController.signal,
          body: JSON.stringify({
            systemPrompt: params.systemPrompt,
            userMessage: params.userMessage,
            jsonResponse: params.jsonResponse,
            model: params.model || "gemini-2.0-flash",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const traceId = response.headers.get('X-Neural-Trace') || errorData.traceId;
          throw new Error(errorData.error || `Synthesis core failed (${response.status})${traceId ? ` [Trace: ${traceId}]` : ""}`);
        }

        const data = await response.json();
        const text = data.text || "";
        
        if (params.jsonResponse) {
          try {
            const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
            let parsed: any;
            
            try {
              parsed = JSON.parse(cleanedText);
            } catch (initialError) {
              const start = cleanedText.indexOf('{');
              const end = cleanedText.lastIndexOf('}');
              if (start !== -1 && end !== -1 && end > start) {
                const jsonPart = cleanedText.substring(start, end + 1);
                parsed = JSON.parse(jsonPart);
              } else {
                throw initialError;
              }
            }

            if (params.schema) {
              return params.schema.parse(parsed);
            }
            return parsed;
          } catch (parseErr) {
            console.warn(`JSON Parse/Validation failure (attempt ${attempt + 1}):`, parseErr);
            attempt++;
            if (attempt >= maxInternalRetries) throw new Error("Neural core failed to produce valid strategic schema.");
            params.userMessage += "\n\nCRITICAL: Your previous response was invalid JSON. Ensure strict compliance.";
            continue;
          }
        }

        return text;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          const isExternalAbort = params.signal?.aborted;
          if (isExternalAbort) throw error; // Re-throw for silent handling in UI
          
          // This was an internal timeout
          throw new Error("Neural core synthesis deadline exceeded (95s). The strategic complexity may be too high for the current provider window.");
        }
        throw error;
      }
    }
  } finally {
    clearTimeout(timeoutId);
    cleanupSignal();
  }
};

export const generateAIContentStream = async (params: {
  systemPrompt?: string;
  userMessage: string;
  onChunk: (text: string) => void;
  jsonResponse?: boolean;
  model?: string;
  tools?: any[];
  cachedContent?: string;
  signal?: AbortSignal;
}) => {
  try {
    const response = await fetch("/api/ai/stream", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Client-ID": getClientId()
      },
      signal: params.signal,
      body: JSON.stringify({
        systemPrompt: params.systemPrompt,
        userMessage: params.userMessage,
        jsonResponse: params.jsonResponse,
        model: params.model,
        tools: params.tools,
        cachedContent: params.cachedContent,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Streaming failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No reader available");

    const decoder = new TextDecoder();
    let fullText = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (dataStr === "[DONE]") break;
          
          try {
            const data = JSON.parse(dataStr);
            if (data.error) throw new Error(data.error);
            if (data.text) {
              fullText += data.text;
              params.onChunk(fullText);
            }
          } catch (e) { /* partial chunk */ }
        }
      }
    }

    if (params.jsonResponse) {
      const cleanedText = fullText.replace(/```json\n?|\n?```/g, "").trim();
      return JSON.parse(cleanedText);
    }

    return fullText;
  } catch (error: any) {
    console.error("AI streaming failed:", error);
    throw error;
  }
};

/**
 * Bounded Self-Correction Strategy
 * Limits API explosion by reducing iterations and adding quality thresholds.
 */
export const generateWithSelfCorrection = async (params: {
  systemPrompt: string;
  userMessage: string;
  jsonResponse?: boolean;
  criteria: string;
  signal?: AbortSignal;
}) => {
  let attempt = 0;
  const maxRefinements = 1; // Reducer: limit to 1 refinement to prevent API explosion
  
  let currentOutput = await generateAIContent(params);
  
  while (attempt < maxRefinements) {
    const critique = await generateAIContent({
      systemPrompt: `Evaluate this output against: ${params.criteria}. Return only valid JSON: { "rating": 1-10, "issues": [], "verdict": "" }`,
      userMessage: `Output: ${JSON.stringify(currentOutput)}`,
      jsonResponse: true,
      signal: params.signal
    });

    if (Number(critique?.rating || 0) >= 8) {
      return { output: currentOutput, verdict: critique.verdict };
    }

    attempt++;
    currentOutput = await generateAIContent({
      systemPrompt: `Fix these issues: ${JSON.stringify(critique.issues)}. Original criteria: ${params.criteria}`,
      userMessage: `Draft: ${JSON.stringify(currentOutput)}`,
      jsonResponse: true,
      signal: params.signal
    });
  }

  return { output: currentOutput, verdict: "Max depth reached." };
};
