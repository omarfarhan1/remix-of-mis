import { generateAIContent, generateAIContentStream } from "./aiService";
import { Company, Offer, Avatar, SynthesisReport } from "../types";
import { generateExecutionPlan } from "./planService";
import { buildFewShotContext, buildIndustryContext } from "./historyService";
import { buildMarketContext } from "./marketContext";

let sessionCacheName: string | null = null;

const AVATAR_STRUCTURE = `{
  "synthesis": {
    "realPrimaryMotivation": "",
    "realPrimaryBlocker": "",
    "actualBuyingWindow": "",
    "winningApproach": "",
    "messagesToUse": [],
    "messagesToAvoid": [],
    "uniqueInsight": "",
    "conflictsResolved": [{ "conflict": "", "resolution": "" }],
    "confidenceScore": 0
  },
  "marketIntelligence": {
    "pricePerception": "",
    "buyingBehavior": "",
    "culturalConsiderations": "",
    "offerFraming": ""
  },
  "elementsOfValue": [{ "category": "", "element": "", "reasonWhy": "" }],
  "valueAnalysis": "",
  "demographics": { "age": "", "income": "", "education": "", "location": "" },
  "traits": { "hobbies": "", "interests": "", "values": "" },
  "sources": { "brands": [], "books": [], "magazines": [], "podcasts": [], "influencers": [] },
  "questionnaire": { 
    "anxious": "", 
    "motivation": "", 
    "fondPast": "", 
    "complicated": "", 
    "valuableInfo": "", 
    "moneyMotivation": "", 
    "healthMotivation": "", 
    "designMotivation": "", 
    "fun": "", 
    "risk": "", 
    "proudRoles": "", 
    "aspiringRoles": "", 
    "averageDay": "", 
    "averageExpectation": "", 
    "appearanceMotivation": "" 
  },
  "transformation": { "beforeProblem": "", "beforeHave": "", "beforeFeelings": "", "beforeDay": "", "beforeStatus": "", "afterBenefit": "", "afterDeepBenefit": "", "afterHave": "", "afterFeelings": "", "afterDay": "", "afterStatus": "", "hook": "" },
  "transformationFramework": { "emotional": { "before": "", "after": "" }, "results": { "before": "", "after": "" }, "lifestyle": { "before": "", "after": "" }, "stress": { "before": "", "after": "" }, "identity": { "before": "", "after": "" }, "relationships": { "before": "", "after": "" }, "selfPerception": { "before": "", "after": "" } },
  "targetedOffer": { 
    "offerName": "", 
    "transformation": "", 
    "hook": "", 
    "reasoning": "", 
    "score": { 
      "total": 0, 
      "clarity": 0, 
      "clarityReasoning": "",
      "relevance": 0, 
      "relevanceReasoning": "",
      "urgency": 0, 
      "urgencyReasoning": "",
      "reasoning": "",
      "explanation": "",
      "improvementTip": "" 
    } 
  },
  "visualDescriptor": "",
  "hesitations": { "judgments": "", "reasoning": "", "addressing": "" },
  "behavioralAnalysis": [{ "category": "", "analysis": "" }],
  "deepContext": {
    "pathToPurchase": {
      "awareness": "",
      "consideration": "",
      "decision": ""
    },
    "beyondDemographics": {
      "valuesAndBeliefs": "",
      "painPoints": "",
      "goalsAndAspirations": "",
      "fearsAndObjections": "",
      "interestsAndHobbies": ""
    },
    "behavioralDetails": {
      "onlineHangouts": "",
      "contentConsumption": "",
      "communicationPreferences": "",
      "purchaseTriggers": ""
    }
  }
}`;

const ASSEMBLY_PROMPT_SYSTEM = `You are the final assembler and a deep-empathy consumer psychologist. 
Convert the multi-agent synthesis into a complete, exhaustive deep-dive.

Rules:
- Return ONLY valid JSON.
- Resolve conflicts using Researcher factual grounding.
- Sharpen every claim the Adversarial probe attacked.
- CRITICAL: Eliminate all generic buzzwords. No "comprehensive", "end-to-end", "solutions", or "packages".
- BE HYPER-SPECIFIC: If the avatar needs better makeup, find the exact chemical or application pain point. If they need business software, find the exact API or workflow friction.
- The "sources" must be REAL brands/books/podcasts.
- For "elementsOfValue", you MUST provide a "reasonWhy" that explains exactly how that element solves a psychological pain point for this specific avatar.
- For "targetedOffer" score, you MUST provide an "explanation" (how the score was calculated based on mental friction) and an "improvementTip" (how to reach a 100 score).
- MANDATORY: You MUST provide detailed, non-generic answers for EVERY SINGLE field in the "questionnaire". Do not leave any blank or "N/A".
- ENRICHED CONTEXT: You MUST populate the "deepContext" section with extreme psychological depth:
    * Path to Purchase: Explain the moment of Awareness, the alternatives they Consider, and the final Decision triggers.
    * Beyond Demographics: Drill into their Values/Beliefs, the real Pain Points keeping them awake, their deepest Goals, and the specific Fears stopping them.
    * Behavioral Details: Map their Online Hangouts (exact platforms/newsletters), Content consumed, and Communication preferences.
- AI Must learn from each avatar info and whole company offer to generate a great avatar offer.`;

export const initAvatarSession = async (company: Company, offer: Offer): Promise<void> => {
  // Session context stored for future caching implementation
  sessionCacheName = null;
};

export const endAvatarSession = async (): Promise<void> => {
  sessionCacheName = null;
};

export const generateInitialAvatars = async (company: Company, offer: Offer, strategicReport?: SynthesisReport): Promise<Avatar[]> => {
  const fewShot = buildFewShotContext(company.industry, 'avatarName');
  const industryContext = buildIndustryContext(company.industry);
  const marketContext = buildMarketContext(company.country);

  const synthesisBrief = strategicReport ? `
  STRATEGIC CONSULTANT FINDINGS (PHASE 1):
  Rating: ${strategicReport.rating}/10
  Key Strengths to Leverage: ${strategicReport.strengths.join(', ')}
  Critical Gaps to Address: ${strategicReport.weaknesses.join(', ')}
  Strategic Recommendations: ${strategicReport.recommendations.join(', ')}
  Verdict: ${strategicReport.verdict}
  ` : "";

  const systemPrompt = `You are a world-class marketing specialist specializing in customer psychology and high-conversion avatars.
Your goal is to identify 10 unique, highly specific customer avatars for a brand based on its USP and core offer.
Avoid generic descriptions. Look for underserved niches or specific life situations.${fewShot}${industryContext}

${marketContext}
${synthesisBrief}

For each avatar, you MUST assign it to EXACTLY ONE of these 4 Major Categories. This is a mandatory flag:
1. Goals and Challenges - What do they desire and what is stopping them? What are they afraid of? What status change do they want?
2. Demographics - What is their age, race, and sex, job title, location, income, number of children, etc?
3. Interest - What are their hobbies? How do they spend their free time? What affiliations do they have? What values do they possess? What do they read, watch, or listen to? Who do they follow?
4. Triggering Events - What life changing event has occurred? What purchase was made? What knowledge has been acquired?

For each avatar, identify a "Single Defining Characteristic" — the one rule that defines if someone belongs to this group. This is a mandatory flag to identify the group.

Return the result as a JSON array of objects with:
"name", "description", "score" (1-10), "reasoning", 
"category" (One of the 4 full names above),
"definingCharacteristic": (The one rule/flag),
"visualDescriptor": (A physical description for image generation),
"canHaveSubAvatars": (boolean, true if this group can be broken down into more granular groups like 'Attorneys' -> 'Bankruptcy attorney')`;

  const companyName = company?.name || 'Unnamed Brand';
  const industry = company?.industry || 'Unspecified Industry';
  const usp = company?.usp || 'No USP Defined';
  const product = offer?.product || 'Unspecified Product';
  const transformation = offer?.transformation || 'No transformation defined';

  const userMessage = `Brand: ${companyName}
Industry: ${industry}
USP: ${usp}
Core Product: ${product}
Main Transformation: ${transformation}

Please list 10 unique avatars.`;

  let avatars = await generateAIContent({
    systemPrompt,
    userMessage,
    jsonResponse: true
  });

  // Handle cases where AI wraps the array in an object
  if (!Array.isArray(avatars) && avatars && typeof avatars === 'object') {
    const arrayKey = Object.keys(avatars).find(key => Array.isArray(avatars[key]));
    if (arrayKey) {
      avatars = avatars[arrayKey];
    }
  }

  if (!Array.isArray(avatars)) {
    console.error("AI did not return an array of avatars:", avatars);
    return [];
  }

  return avatars.map((a: any, i: number) => ({
    id: `avatar_${Date.now()}_${i}`,
    companyId: company.id,
    ...a
  }));
};

export const generateSubAvatars = async (parent: Avatar, company: Company, offer: Offer): Promise<Avatar[]> => {
  const parentName = parent?.name || 'Unnamed Avatar';
  const parentCategory = parent?.category || 'General';
  const parentDescription = parent?.description || 'No description';
  const parentCharacteristic = parent?.definingCharacteristic || 'No characteristics defined';

  const systemPrompt = `You are a specialist in niche market segmentation. 
You are drilling down into a specific customer avatar: "${parentName}".
Your goal is to create 5 even more granular sub-avatars.

Example:
Parent: Small Business Owner
Sub-avatars: Attorneys, Accountants, Financial Planners.

Example:
Parent: Attorneys
Sub-avatars: Bankruptcy Attorney, Family Law Attorney, Corporate Attorney.

Return a JSON array of objects with:
"name", 
"description", 
"category" (same as parent: ${parentCategory}),
"definingCharacteristic": (more specific characteristic),
"visualDescriptor": (physical description for image generation),
"canHaveSubAvatars": (true if even more granular breakdown is possible).`;

  const userMessage = `Parent Avatar: ${parentName}
Description: ${parentDescription}
Defining Characteristic: ${parentCharacteristic}

Generate 5 sub-avatars.`;

  let avatars = await generateAIContent({
    systemPrompt,
    userMessage,
    jsonResponse: true
  });

  if (!Array.isArray(avatars) && avatars && typeof avatars === 'object') {
    const arrayKey = Object.keys(avatars).find(key => Array.isArray(avatars[key]));
    if (arrayKey) avatars = avatars[arrayKey];
  }

  if (!Array.isArray(avatars)) {
    console.error("AI did not return an array of sub-avatars:", avatars);
    return [];
  }

  return avatars.map((a: any, idx: number) => ({
    ...a,
    id: `sub_avatar_${Date.now()}_${idx}`,
    companyId: company.id,
    parentId: parent.id
  }));
};

export const deepDiveAvatar = async (company: Company, offer: Offer, avatar: Avatar): Promise<Avatar> => {
  const companyName = company?.name || 'Unnamed Brand';
  const industry = company?.industry || 'Unspecified Industry';
  const product = offer?.product || 'Unspecified Product';
  const usp = company?.usp || 'No USP Defined';
  const avatarName = avatar?.name || 'Unnamed';
  const avatarDesc = avatar?.description || 'No description';
  const avatarChar = avatar?.definingCharacteristic || 'No characteristics';

  const context = `Brand: ${companyName} (${industry})
Product: ${product}
USP: ${usp}
Avatar: ${avatarName} - ${avatarDesc}
Core Transformation: ${avatarChar}`;

  const fewShot = buildFewShotContext(company.industry, 'hook');
  const marketContext = buildMarketContext(company.country);

  const ADVOCATE_PROMPT = `You are the Advocate agent in a multi-agent marketing intelligence system. Your job: assume this avatar is a PERFECT customer. Build the strongest possible psychological case for why they buy. 

${marketContext}

Return ONLY valid JSON.${fewShot}`;
  const SKEPTIC_PROMPT = `You are the Skeptic agent in a multi-agent marketing intelligence system. Your job: assume this avatar will NEVER buy. Be ruthless and specific. 

${marketContext}

Return ONLY valid JSON.${fewShot}`;
  const RESEARCHER_PROMPT = `You are the Researcher agent in a multi-agent marketing intelligence system. Your job: ignore opinion. Report only factually observable data. 

${marketContext}

Return ONLY valid JSON.`;
  const SYNTHESIS_PROMPT = `You are the Synthesis layer. Synthesize 3 perspectives (Advocate, Skeptic, Researcher) into one coherent picture. 

${marketContext}

Return ONLY valid JSON.`;
  const ADVERSARIAL_PROMPT = `You are the Adversarial Probe. You are a customer who would NEVER buy. Attack the synthesis profile from the inside. Find every generic or over-optimistic claim. Return ONLY valid JSON.`;
  const SCORE_GATE_PROMPT = `You are the Score Gate. Evaluate if the synthesis is strong enough (pass) or needs another pass (retry) with adversarial feedback. Return ONLY valid JSON.`;

  let injectedFeedback = "";
  let totalCalls = 0;
  let retriesUsed = 0;
  let synthesisResult: any;
  let adversarialResult: any;
  let gateResult: any;

  for (let attempt = 0; attempt <= 2; attempt++) {
    // LAYER 1 — Parallel Thinking
    const [advocateRes, skepticRes, researcherRes] = await Promise.all([
      generateAIContent({ systemPrompt: ADVOCATE_PROMPT, userMessage: context + (injectedFeedback ? `\n\nFEEDBACK TO ADDRESS:\n${injectedFeedback}` : ""), jsonResponse: true }),
      generateAIContent({ systemPrompt: SKEPTIC_PROMPT, userMessage: context + (injectedFeedback ? `\n\nFEEDBACK TO ADDRESS:\n${injectedFeedback}` : ""), jsonResponse: true }),
      generateAIContent({ systemPrompt: RESEARCHER_PROMPT, userMessage: context, jsonResponse: true })
    ]);
    totalCalls += 3;

    // LAYER 2 — Synthesis
    synthesisResult = await generateAIContent({
      systemPrompt: SYNTHESIS_PROMPT,
      userMessage: `Advocate: ${JSON.stringify(advocateRes)}\nSkeptic: ${JSON.stringify(skepticRes)}\nResearcher: ${JSON.stringify(researcherRes)}`,
      jsonResponse: true
    });
    totalCalls++;

    // LAYER 3 — Adversarial Probe
    adversarialResult = await generateAIContent({
      systemPrompt: ADVERSARIAL_PROMPT,
      userMessage: `Profile to attack: ${JSON.stringify(synthesisResult)}`,
      jsonResponse: true
    });
    totalCalls++;

    // LAYER 4 — Score Gate
    gateResult = await generateAIContent({
      systemPrompt: SCORE_GATE_PROMPT,
      userMessage: `Synthesis: ${JSON.stringify(synthesisResult)}\nAdversarial: ${JSON.stringify(adversarialResult)}
      Return JSON:
      {
        "scores": { "specificity": 0, "psychologicalAccuracy": 0, "actionability": 0, "resistanceAddressed": 0, "overall": 0 },
        "decision": "pass | retry",
        "retryReason": "",
        "injectionForRetry": "feedback for Layer 1"
      }`,
      jsonResponse: true
    });
    totalCalls++;

    if (gateResult.decision === "pass" || attempt === 2) {
      break;
    }

    injectedFeedback = gateResult.injectionForRetry;
    retriesUsed++;
  }

  const assemblyResult = await generateAIContent({
    systemPrompt: ASSEMBLY_PROMPT_SYSTEM,
    userMessage: `Synthesis: ${JSON.stringify(synthesisResult)}\nAdversarial: ${JSON.stringify(adversarialResult)}\nGate Decision: ${JSON.stringify(gateResult)}\n\nFollow this structure:\n${AVATAR_STRUCTURE}`,
    jsonResponse: true,
    tools: [{ googleSearch: {} }]
  });
  totalCalls++;

  const details = assemblyResult;
  const executionPlan = await generateExecutionPlan(company, offer, { ...avatar, ...details });

  return {
    ...avatar,
    ...details,
    executionPlan,
    pipelineMetadata: {
      totalCalls,
      retriesUsed,
      synthesisConfidence: synthesisResult.synthesisConfidence || gateResult.scores.overall,
      scoreGateDecision: gateResult.decision,
      adversarialAttacksResolved: adversarialResult.attackedClaims?.length || 0
    }
  };
};

export const regenerateTargetedOffer = async (company: Company, offer: Offer, avatar: Avatar): Promise<Avatar> => {
  const avatarName = avatar?.name || 'Unnamed';
  const avatarDesc = avatar?.description || 'No description';
  const hook = avatar?.transformation?.hook || 'No hook';
  const product = offer?.product || 'Unspecified Product';
  const generatedOffer = offer?.generatedOffer || 'No copy';
  const usp = company?.usp || 'No USP';

  const systemPrompt = `You are a high-conversion offer architect. 
  Your goal is to rewrite the "targetedOffer" for this avatar based on new company intelligence.
  
  Avatar: ${avatarName} - ${avatarDesc}
  Transformation Hook: ${hook}
  Psychological Profile: ${JSON.stringify(avatar?.synthesis || {})}
  
  Company USP: ${usp}
  Company Product: ${product}
  Whole Company Offer: ${generatedOffer}
  
  AI MUST learn from each avatar info and whole company offer to generate a great avatar offer.
  
  Return ONLY valid JSON for the targetedOffer field:
  {
    "targetedOffer": {
      "offerName": "",
      "transformation": "",
      "hook": "",
      "reasoning": "",
      "score": {
        "total": 0,
        "clarity": 0,
        "clarityReasoning": "Why this clarity score?",
        "relevance": 0,
        "relevanceReasoning": "Why this relevance score?",
        "urgency": 0,
        "urgencyReasoning": "Why this urgency score?",
        "reasoning": "",
        "explanation": "",
        "improvementTip": ""
      }
    }
  }`;

  const result = await generateAIContent({
    systemPrompt,
    userMessage: `Please regenerate the hyper-targeted offer for ${avatar.name}.`,
    jsonResponse: true
  });

  return {
    ...avatar,
    targetedOffer: result.targetedOffer
  };
};

export const deepDiveAvatarStream = async (
  company: Company, 
  offer: Offer, 
  avatar: Avatar,
  onChunk: (partial: string) => void
): Promise<Avatar> => {
  const companyName = company?.name || 'Unnamed Brand';
  const industry = company?.industry || 'Unspecified Industry';
  const product = offer?.product || 'Unspecified Product';
  const usp = company?.usp || 'No USP Defined';
  const avatarName = avatar?.name || 'Unnamed';
  const avatarDesc = avatar?.description || 'No description';
  const avatarChar = avatar?.definingCharacteristic || 'No characteristics';

  const context = `Brand: ${companyName} (${industry})
Product: ${product}
USP: ${usp}
Avatar: ${avatarName} - ${avatarDesc}
Core Transformation: ${avatarChar}`;

  const fewShot = buildFewShotContext(company.industry, 'hook');
  const marketContext = buildMarketContext(company.country);

  const ADVOCATE_PROMPT = `You are the Advocate agent in a multi-agent marketing intelligence system. Your job: assume this avatar is a PERFECT customer. Build the strongest possible psychological case for why they buy. 

${marketContext}

Return ONLY valid JSON.${fewShot}`;
  const SKEPTIC_PROMPT = `You are the Skeptic agent in a multi-agent marketing intelligence system. Your job: assume this avatar will NEVER buy. Be ruthless and specific. 

${marketContext}

Return ONLY valid JSON.${fewShot}`;
  const RESEARCHER_PROMPT = `You are the Researcher agent in a multi-agent marketing intelligence system. Your job: ignore opinion. Report only factually observable data. 

${marketContext}

Return ONLY valid JSON.`;
  const SYNTHESIS_PROMPT = `You are the Synthesis layer. Synthesize 3 perspectives (Advocate, Skeptic, Researcher) into one coherent picture. 

${marketContext}

Return ONLY valid JSON.`;
  const ADVERSARIAL_PROMPT = `You are the Adversarial Probe. You are a customer who would NEVER buy. Attack the synthesis profile from the inside. Find every generic or over-optimistic claim. Return ONLY valid JSON.`;
  const SCORE_GATE_PROMPT = `You are the Score Gate. Evaluate if the synthesis is strong enough (pass) or needs another pass (retry) with adversarial feedback. Return ONLY valid JSON.`;

  let injectedFeedback = "";
  let totalCalls = 0;
  let retriesUsed = 0;
  let synthesisResult: any;
  let adversarialResult: any;
  let gateResult: any;

  for (let attempt = 0; attempt <= 1; attempt++) {
    const [advocateRes, skepticRes, researcherRes] = await Promise.all([
      generateAIContent({ systemPrompt: ADVOCATE_PROMPT, userMessage: context + (injectedFeedback ? `\n\nFEEDBACK TO ADDRESS:\n${injectedFeedback}` : ""), jsonResponse: true }),
      generateAIContent({ systemPrompt: SKEPTIC_PROMPT, userMessage: context + (injectedFeedback ? `\n\nFEEDBACK TO ADDRESS:\n${injectedFeedback}` : ""), jsonResponse: true }),
      generateAIContent({ systemPrompt: RESEARCHER_PROMPT, userMessage: context, jsonResponse: true })
    ]);
    totalCalls += 3;

    synthesisResult = await generateAIContent({
      systemPrompt: SYNTHESIS_PROMPT,
      userMessage: `Advocate: ${JSON.stringify(advocateRes)}\nSkeptic: ${JSON.stringify(skepticRes)}\nResearcher: ${JSON.stringify(researcherRes)}`,
      jsonResponse: true
    });
    totalCalls++;

    adversarialResult = await generateAIContent({
      systemPrompt: ADVERSARIAL_PROMPT,
      userMessage: `Profile to attack: ${JSON.stringify(synthesisResult)}`,
      jsonResponse: true
    });
    totalCalls++;

    gateResult = await generateAIContent({
      systemPrompt: SCORE_GATE_PROMPT,
      userMessage: `Synthesis: ${JSON.stringify(synthesisResult)}\nAdversarial: ${JSON.stringify(adversarialResult)}
      Return JSON:
      {
        "scores": { "specificity": 0, "psychologicalAccuracy": 0, "actionability": 0, "resistanceAddressed": 0, "overall": 0 },
        "decision": "pass | retry",
        "retryReason": "",
        "injectionForRetry": "feedback for Layer 1"
      }`,
      jsonResponse: true
    });
    totalCalls++;

    if (gateResult.decision === "pass" || attempt === 1) {
      break;
    }

    injectedFeedback = gateResult.injectionForRetry;
    retriesUsed++;
  }

  const assemblyResult = await generateAIContentStream({
    systemPrompt: ASSEMBLY_PROMPT_SYSTEM,
    userMessage: `Avatar to analyze: ${avatar.name} - ${avatar.description}\n\nSynthesis from multi-agent session: ${JSON.stringify(synthesisResult)}\nAdversarial: ${JSON.stringify(adversarialResult)}\nGate Decision: ${JSON.stringify(gateResult)}\n\nFollow this structure:\n${AVATAR_STRUCTURE}`,
    onChunk: (text) => onChunk(text),
    jsonResponse: true,
  });
  totalCalls++;

  const details = assemblyResult;
  const executionPlan = await generateExecutionPlan(company, offer, { ...avatar, ...details });

  return {
    ...avatar,
    ...details,
    executionPlan,
    pipelineMetadata: {
      totalCalls,
      retriesUsed,
      synthesisConfidence: synthesisResult.synthesisConfidence || gateResult.scores.overall,
      scoreGateDecision: gateResult.decision,
      adversarialAttacksResolved: adversarialResult.attackedClaims?.length || 0
    }
  };
};
