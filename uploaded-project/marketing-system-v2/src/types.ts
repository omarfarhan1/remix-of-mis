export interface Specialization {
  name: string;
  note: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  logoUrl?: string; // Optional logo URL
  specializations: Specialization[];
  usp: string;
  country: string;
  websiteUrl?: string;
  isGlobalMode?: boolean;
  createdAt: string;
  validationResult?: {
    question: string;
    example: string;
    score: number;
  };
}

export interface OfferScore {
  total: number;
  clarity: number;
  clarityReasoning?: string;
  relevance: number;
  relevanceReasoning?: string;
  urgency: number;
  urgencyReasoning?: string;
  reasoning: string;
  explanation?: string;
  improvementTip?: string;
}

export interface Offer {
  companyId: string;
  product: string;
  relevance: string;
  reason: string;
  audience: string;
  transformation: string;
  generatedOffer: string;
  generatedAt: string;
  score?: OfferScore;
  history?: Offer[];
  fixSuggestion?: {
    weakestDimension: string;
    diagnosis: string;
    fixSentence: string;
    whereToPutIt: string;
  };
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'Copywriting' | 'Design' | 'Technical' | 'Strategy';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  timeEstimate: string;
}

export interface EditSignal {
  field: string;
  before: string;
  after: string;
  industry: string;
  timestamp: string;
  type: 'user_edit' | 'score_improvement';
  deltaScore?: number;
}

export interface IndustryIntelligence {
  topAvatarCategories: string[];
  bestTransformationAngles: string[];
  offerStructuresThatWorked: string[];
  avatarCategoriesDrilledInto: string[];
  lowScoringPatterns: string[];
  avgScoreImprovement: number;
  companiesAnalyzed: number;
  lastUpdated: string;
}

export interface ScoreDeltaInsight {
  deltaTotal: number;
  biggestGain: string;
  gainAmount: number;
  narrative: string;
  whatAvatarsDid: string;
  nextWeakLink: string;
  suggestion: string;
}

export interface RankedAvatarMetadata {
  displayRank: number;
  displayState: 'expanded' | 'collapsed';
  collapseReason?: string;
  priorityLabel: 'primary' | 'secondary' | 'low-priority';
  actionSuggestion: string;
}

export interface Avatar {
  id: string;
  companyId: string;
  name: string;
  description: string;
  score?: number;
  reasoning?: string;
  definingCharacteristic: string;
  visualDescriptor: string; // Added: missing in previous version
  category: 'Goals and Challenges' | 'Demographics' | 'Interest' | 'Triggering Events';
  canHaveSubAvatars: boolean;
  parentId?: string;
  subAvatars?: Avatar[];
  
  // Elements of Value (Bain & Co Pyramid)
  elementsOfValue?: {
    category: 'Functional' | 'Emotional' | 'Life Changing' | 'Social Impact';
    element: string;
    reasonWhy?: string;
  }[];
  valueAnalysis?: string;
  
  // Detailed info (Prompts 3-6)
  demographics?: {
    age: string;
    income: string;
    education: string;
    location: string;
  };
  traits?: {
    hobbies: string;
    interests: string;
    values: string;
  };
  sources?: {
    brands: string[];
    books: string[];
    magazines: string[];
    podcasts: string[];
    influencers: string[];
  };
  questionnaire?: {
    anxious: string;
    motivation: string;
    fondPast: string;
    complicated: string;
    valuableInfo: string;
    moneyMotivation: string;
    healthMotivation: string;
    designMotivation: string;
    fun: string;
    risk: string;
    proudRoles: string;
    aspiringRoles: string;
    averageDay: string;
    averageExpectation: string;
    appearanceMotivation: string;
  };
  transformation?: {
    beforeProblem: string;
    beforeHave: string;
    beforeFeelings: string;
    beforeDay: string;
    beforeStatus: string;
    afterBenefit: string;
    afterDeepBenefit: string;
    afterHave: string;
    afterFeelings: string;
    afterDay: string;
    afterStatus: string;
    hook: string;
  };
  hesitations?: {
    judgments: string;
    reasoning: string;
    addressing: string;
  };

  // New Profile Extension
  imageUrl?: string;
  transformationFramework?: {
    emotional: { before: string; after: string };
    results: { before: string; after: string };
    lifestyle: { before: string; after: string };
    stress: { before: string; after: string };
    identity: { before: string; after: string };
    relationships: { before: string; after: string };
    selfPerception: { before: string; after: string };
    identityTransformation?: { from: string; to: string }; // Added for clarity
  };
  targetedOffer?: {
    offerName: string;
    transformation: string;
    hook: string;
    reasoning: string;
    score?: OfferScore;
  };
  marketIntelligence?: {
    pricePerception: string;
    buyingBehavior: string;
    culturalConsiderations: string;
    offerFraming: string;
  };
  behavioralAnalysis?: {
    category: 'Functional' | 'Emotional' | 'Life Changing' | 'Social Impact';
    analysis: string;
  }[];
  executionPlan?: ActionItem[];
  critique?: string; // Intelligence Hub feedback
  synthesis?: {
    realPrimaryMotivation: string;
    realPrimaryBlocker: string;
    actualBuyingWindow: string;
    winningApproach: string;
    messagesToUse: string[];
    messagesToAvoid: string[];
    uniqueInsight: string;
    conflictsResolved: { conflict: string; resolution: string }[];
    confidenceScore: number;
  };
  adversarialProbe?: {
    attackVector: string;
    objection: string;
    resolution: string;
    isResolved: boolean;
  }[]; // Added: structured types for adversarial results
  pipelineMetadata?: {
    totalCalls: number;
    retriesUsed: number;
    synthesisConfidence: number; // Keep for metrics
    scoreGateDecision: string;
    adversarialAttacksResolved: number;
  };
  uiMetadata?: RankedAvatarMetadata;
  
  // Enriched Context (Requested by user)
  deepContext?: {
    pathToPurchase: {
      awareness: string;
      consideration: string;
      decision: string;
    };
    beyondDemographics: {
      valuesAndBeliefs: string;
      painPoints: string;
      goalsAndAspirations: string;
      fearsAndObjections: string;
      interestsAndHobbies: string;
    };
    behavioralDetails: {
      onlineHangouts: string;
      contentConsumption: string;
      communicationPreferences: string;
      purchaseTriggers: string;
    };
  };
}

export interface SynthesisReport {
  rating: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  verdict: string;
}

export interface ActionableInsight {
  type: 'warning' | 'opportunity' | 'action';
  title: string;
  observation: string;
  action: string;
  why: string;
  urgency: 'before_next_stage' | 'anytime';
}

export interface Progress {
  stage1Complete: boolean;
  stage2Complete: boolean;
  stage3Complete: boolean;
  avatars?: Avatar[];
  scoreDelta?: ScoreDeltaInsight;
  actionableInsights?: ActionableInsight[];
  synthesisReports?: Record<string, SynthesisReport>;
}

export type Stage = 1 | 2 | 3 | 4;
