import { Company } from '../types';

export interface OfferStepData {
  key: 'product' | 'relevance' | 'reason' | 'audience' | 'transformation';
  name: string;
  title: string;
  description: string;
  example: string;
  placeholder: string;
}

export const getOfferSteps = (company?: Partial<Company>, draftOffer?: any): OfferStepData[] => {
  const industry = company?.industry || 'your industry';
  const name = company?.name || 'your company';
  const usp = company?.usp || 'your unique value';
  const country = company?.country || 'Global';
  const specs = company?.specializations?.map(s => s.name).join(' & ') || '';

  const industryContext = specs ? `${specs} in ${industry}` : industry;
  const isEgypt = country === 'Egypt';
  const isFitness = industry.toLowerCase().includes('fitness');

  // Dynamic values based on previous steps
  const product = draftOffer?.product || 'your product';
  const relevance = draftOffer?.relevance || 'this specific timing';

  return [
    {
      key: 'audience',
      name: "Target Audience",
      title: "Who is this offer for?",
      description: "Describe your ideal customer precisely. The more specific, the better.",
      example: isEgypt && isFitness
        ? "Busy Cairo professionals over 35 who spend 12 hours a day between traffic and the office, have developed a 'karsh' (belly), and are worried about their health but have zero time to commute to a fancy gym."
        : isFitness 
        ? "Busy fathers over 40 who have gained 10kg in the last 2 years and want to regain their energy."
        : industry.toLowerCase().includes('marketing') || industry.toLowerCase().includes('consulting')
        ? "B2B SaaS founders who just raised seed funding and need to scale through cold outreach."
        : `People who are currently using ${industryContext} but are frustrated with ${usp.slice(0, 30)}...`,
      placeholder: `e.g. Someone in ${industry} looking for...`
    },
    {
        key: 'product',
        name: "Product / Service",
        title: "What are you offering?",
        description: `Describe exactly what the customer gets from ${name}.`,
        example: isEgypt && isFitness
          ? `A 90-day hybrid coaching program that blends personalized home-workout plans with an Egyptian-diet-friendly nutrition guide (how to eat your favorite food without guilt).`
          : isFitness
          ? `Our specialized ${specs} coaching that uses dynamic resistance to burn fat 2x faster.`
          : `A comprehensive ${industryContext} package that simplifies ${usp.slice(0, 40)} for your business.`,
        placeholder: "Describe your product or service..."
    },
    {
        key: 'transformation',
        name: "Transformation",
        title: "What changes for them?",
        description: "Sell the outcome, not the features. What is the before vs after?",
        example: isEgypt && isFitness
          ? "Go from feeling out of breath after two flights of stairs to feeling fit, sharp, and confident enough to lead a board meeting in the morning and play with your kids in the evening."
          : isFitness
          ? "Go from avoiding the mirror to wearing your favorite old jeans with total confidence in 90 days."
          : `Transform your ${industry} results from mediocre to market-leading by leveraging ${usp.split(' ')[0]}...`,
        placeholder: "Life before vs. after using your product..."
    },
    {
      key: 'relevance',
      name: "Relevance",
      title: "Why does this matter right now?",
      description: "Connect your offer to what is happening in your customer's life today.",
      example: isEgypt && isFitness
        ? "With rising lifestyle-related health concerns in the city and the high costs of ineffective gym memberships, our evidence-based, sustainable approach is the only way to get real results without breaking the bank or wasting hours in traffic."
        : `With the current shift in the ${industry} market, traditional methods are failing. ${product} is the essential bridge to the new way of working.`,
      placeholder: `Why is ${product} perfect for this specific moment?`
    },
    {
      key: 'reason',
      name: "Reason to Act",
      title: "Why should they act NOW?",
      description: "Add urgency — a deadline, a bonus, or a specific window of opportunity.",
      example: isEgypt && isFitness
        ? "The next 5 sign-ups get a full custom metabolic assessment for free (worth 1,500 EGP), plus our 'Sahel Ready' meal prep guide. Tagseet (installments) options available."
        : `Because ${relevance.toLowerCase()}, we're giving the next 5 clients a 1-on-1 strategy session to ensure immediate success with ${product}.`,
      placeholder: "Limited time offer, bonus gift, or upcoming deadline..."
    }
  ];
};
