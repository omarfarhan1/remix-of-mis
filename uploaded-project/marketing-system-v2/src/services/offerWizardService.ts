import { Company } from "../types";
import { buildFewShotContext } from "./historyService";

let history: { role: 'user' | 'model', content: string }[] = [];
let companyContext: Company | null = null;

export const startOfferWizardSession = (company: Company) => {
  history = [];
  companyContext = company;
  return true;
};

export const sendWizardStep = async (message: string) => {
  if (!companyContext) {
    throw new Error("Start a session first");
  }

  const fewShot = buildFewShotContext(companyContext.industry);
  const systemPrompt = `You are a strategic offer consultant for ${companyContext.name} in the ${companyContext.industry} industry.
      USP: ${companyContext.usp}
      
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

  try {
    const response = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemPrompt,
        message,
        history,
        // model: "gemini-2.0-flash", // Use server default
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Chat failed with status ${response.status}`);
    }

    const data = await response.json();
    const resultText = data.text;

    history.push({ role: 'user', content: message });
    history.push({ role: 'model', content: resultText });

    return resultText;
  } catch (error: any) {
    console.error("Wizard chat failed:", error);
    throw error;
  }
};

export const endWizardSession = () => {
  history = [];
  companyContext = null;
};
