import { Company } from "../types";
import { buildFewShotContext } from "./historyService";

type ChatTurn = { role: 'user' | 'model'; content: string };

export interface OfferWizardSession {
  readonly companyId: string;
  send(message: string): Promise<string>;
  end(): void;
}

class OfferWizardSessionImpl implements OfferWizardSession {
  readonly companyId: string;
  private readonly company: Company;
  private history: ChatTurn[] = [];
  private ended = false;

  constructor(company: Company) {
    this.companyId = company.id;
    this.company = company;
  }

  async send(message: string): Promise<string> {
    if (this.ended) {
      throw new Error("Wizard session has ended");
    }

    const fewShot = buildFewShotContext(this.company.industry);
    const systemPrompt = `You are a strategic offer consultant for ${this.company.name} in the ${this.company.industry} industry.
      USP: ${this.company.usp}
      
      ${fewShot}
      
      Your goal is to help the user build a high-converting marketing offer step by step.
      At each step, the user will provide an answer or ask for help.
      You should:
      1. Briefly acknowledge and validate their choice.
      2. Provide 2-3 specific, high-level suggestions to refine or improve that specific element.
      3. Explain the psychological trigger or strategic reason behind your suggestions.
      4. Keep responses concise, professional, and encouraging.
      
      Never start from scratch; always build on previous context.
      Return responses as plain readable text with clear bullet points. No JSON unless explicitly requested.`;

    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemPrompt,
        message,
        history: this.history,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Chat failed with status ${response.status}`);
    }

    const data = await response.json();
    const resultText: string = data.text;

    this.history.push({ role: 'user', content: message });
    this.history.push({ role: 'model', content: resultText });

    return resultText;
  }

  end(): void {
    this.ended = true;
    this.history = [];
  }
}

/**
 * Per-company session registry. Keyed by company.id so multiple companies
 * (or stale references) cannot leak history/context across each other.
 * Note: each browser tab has its own JS realm, so this also gives us
 * implicit per-tab isolation.
 */
const sessions = new Map<string, OfferWizardSessionImpl>();

export const startOfferWizardSession = (company: Company): OfferWizardSession => {
  const existing = sessions.get(company.id);
  if (existing) existing.end();
  const session = new OfferWizardSessionImpl(company);
  sessions.set(company.id, session);
  return session;
};

export const getOfferWizardSession = (companyId: string): OfferWizardSession | undefined =>
  sessions.get(companyId);

export const sendWizardStep = async (companyId: string, message: string): Promise<string> => {
  const session = sessions.get(companyId);
  if (!session) throw new Error("Start a session first");
  return session.send(message);
};

export const endWizardSession = (companyId?: string): void => {
  if (companyId === undefined) {
    sessions.forEach(s => s.end());
    sessions.clear();
    return;
  }
  const session = sessions.get(companyId);
  if (session) {
    session.end();
    sessions.delete(companyId);
  }
};

/** Test-only helper. */
export const __resetOfferWizardSessions = () => {
  sessions.forEach(s => s.end());
  sessions.clear();
};
