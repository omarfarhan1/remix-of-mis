import { Company, Offer, Avatar } from '../types';
import { generateAIContent, generateWithSelfCorrection } from './aiService';

export interface SynthesisReport {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  verdict: string;
}

export async function generateStage1Synthesis(company: Company, signal?: AbortSignal): Promise<SynthesisReport> {
  const name = company?.name || 'Unnamed Brand';
  const industry = company?.industry || 'Unspecified Industry';
  const specializations = company?.specializations?.map(s => s.name).join(', ') || 'General';
  const usp = company?.usp || 'No USP defined';
  const country = company?.country || 'Global';

  const systemPrompt = `You are a high-level strategic brand consultant. 
  You are analyzing a brand identity to ensure it has enough "flesh on the bones" to support high-converting marketing campaigns.
  
  RETURN ONLY JSON in this format:
  {
    "rating": number (1-10),
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": string[],
    "verdict": "short punchy quote"
  }`;
  
  const userMessage = `
    Analyze this Brand Profile:
    - Name: ${name}
    - Industry: ${industry}
    - Specializations: ${specializations}
    - USP: ${usp}
    - Market: ${country}
  `;

  return await generateAIContent({
    systemPrompt,
    userMessage,
    jsonResponse: true,
    signal
  });
}

export async function generateStage2Synthesis(company: Company, offer: Offer, signal?: AbortSignal): Promise<SynthesisReport> {
  const companyName = company?.name || 'Unnamed Brand';
  const industry = company?.industry || 'Unspecified Industry';
  
  const product = offer?.product || 'Unspecified Product';
  const audience = offer?.audience || 'Unspecified Audience';
  const transformation = offer?.transformation || 'Unspecified Transformation';
  const generatedOffer = offer?.generatedOffer || 'No copy generated yet';

  const systemPrompt = `You are a world-class conversion optimizer and direct-response copywriter.
  You are evaluating the Core Offer (Strategy) against the Brand Identity.
  
  RETURN ONLY JSON in this format:
  {
    "rating": number (1-10),
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": string[],
    "verdict": "short punchy quote"
  }`;
  
  const userMessage = `
    Brand: ${companyName}
    Industry: ${industry}
    
    Proposed Offer Formula:
    - Product: ${product}
    - Target Audience: ${audience}
    - Transformation: ${transformation}
    
    Generated Copy:
    "${generatedOffer}"
  `;

  return await generateAIContent({
    systemPrompt,
    userMessage,
    jsonResponse: true,
    signal
  });
}

export async function generateStage3Synthesis(company: Company, avatars: Avatar[], signal?: AbortSignal): Promise<SynthesisReport> {
  const companyName = company?.name || 'Unnamed Brand';
  const avatarList = (avatars || []).map(a => `- ${a.name || 'Unnamed'} (${a.category || 'General'}): ${a.definingCharacteristic || 'No characteristics defined'}`).join('\n');

  const systemPrompt = `You are a psychological profiling expert and market researcher.
  You are evaluating the depth and accuracy of the customer avatars generated.
  
  RETURN ONLY JSON in this format:
  {
    "rating": number (1-10),
    "strengths": string[],
    "weaknesses": string[],
    "recommendations": string[],
    "verdict": "short punchy quote"
  }`;

  const userMessage = `
    Company: ${companyName}
    Avatars:
    ${avatarList || 'No avatars generated yet.'}
  `;

  return await generateAIContent({
    systemPrompt,
    userMessage,
    jsonResponse: true,
    signal
  });
}
