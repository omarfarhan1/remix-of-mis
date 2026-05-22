import React from 'react';
import { Building2 } from 'lucide-react';
import { OfferStep } from '../components/stage2/OfferStep';
import { GeneratingScreen } from '../components/stage2/GeneratingScreen';
import { OfferResult } from '../components/stage2/OfferResult';
import { ActionableInsightsCard } from '../components/intel/ActionableInsightsCard';
import { getOfferSteps } from '../constants/offerSteps';
import { useCompanies, useActiveCompanyId } from '../stores/companyStore';
import {
  useOffers,
  useProgress,
  useDraftOffer,
  useIsGenerating,
  useGenerationError,
  useOfferActions,
} from '../stores/offerStore';
import { useStageStep, useWorkflowActions } from '../stores/workflowStore';
import { useStageInsights, useIsInsightsLoading } from '../stores/insightsStore';

interface Props {
  onGenerateOffer: (forceOverwrite?: boolean) => void;
}

export function Stage2Routes({ onGenerateOffer }: Props) {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const offers = useOffers();
  const progress = useProgress();
  const draftOffer = useDraftOffer();
  const isGenerating = useIsGenerating();
  const generationError = useGenerationError();
  const { setDraftOffer, setOffers } = useOfferActions();
  const stageStep = useStageStep();
  const { setStageStep, setCurrentView } = useWorkflowActions();
  const stageInsights = useStageInsights();
  const isInsightsLoading = useIsInsightsLoading();

  const offerSteps = getOfferSteps(activeCompany || {}, draftOffer);

  return (
    <div className="pt-4">
      {isGenerating ? (
        <GeneratingScreen />
      ) : generationError ? (
        <div className="max-w-[640px] mx-auto px-4 pt-20 pb-20 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
            <Building2 size={32} />
          </div>
          <h3 className="text-[20px] font-medium mb-2">Generation Failed</h3>
          <p className="text-[15px] text-[var(--color-text-secondary)] mb-8 leading-relaxed">
            {generationError}
          </p>
          <div className="flex justify-center gap-4">
            <button onClick={() => setStageStep(5)} className="px-6 py-3 rounded-2xl bg-gray-100 text-[14px] font-bold">
              Edit Formula
            </button>
            <button onClick={() => onGenerateOffer(true)} className="btn-primary px-8">
              Try Again
            </button>
          </div>
        </div>
      ) : stageStep <= 5 ? (
        <OfferStep
          step={stageStep}
          totalSteps={5}
          stepName={offerSteps[stageStep - 1].name}
          title={offerSteps[stageStep - 1].title}
          description={offerSteps[stageStep - 1].description}
          example={offerSteps[stageStep - 1].example}
          placeholder={offerSteps[stageStep - 1].placeholder}
          fieldKey={offerSteps[stageStep - 1].key}
          company={activeCompany || {}}
          draftOffer={draftOffer}
          value={(draftOffer as any)[offerSteps[stageStep - 1].key] || ''}
          onChange={(val) => setDraftOffer({ ...draftOffer, [offerSteps[stageStep - 1].key]: val })}
          onNext={() => (stageStep === 5 ? onGenerateOffer() : setStageStep(stageStep + 1))}
          onBack={() => (stageStep === 1 ? setCurrentView('returning') : setStageStep(stageStep - 1))}
          onStepNav={(s) => setStageStep(s)}
          isLast={stageStep === 5}
          isStageComplete={progress[activeCompany?.id || '']?.stage2Complete}
        />
      ) : (
        <div className="space-y-0">
          <OfferResult
            company={activeCompany!}
            offer={offers[activeCompanyId!]!}
            onUpdateOffer={(updated) => {
              setOffers(prev => ({ ...prev, [activeCompanyId!]: updated }));
            }}
            onRegenerate={() => onGenerateOffer()}
            onEdit={() => {
              setDraftOffer(offers[activeCompanyId!] || { product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
              setStageStep(1);
            }}
            onContinue={() => {
              setCurrentView('stage3');
              setStageStep(1);
            }}
            progress={progress[activeCompanyId!]}
            onStepNav={(s) => setStageStep(s)}
          />
          <ActionableInsightsCard
            insights={stageInsights[`${activeCompanyId}-offer`] || []}
            isLoading={isInsightsLoading}
            onAction={(ins) => {
              if (ins.action.toLowerCase().includes('urgency')) {
                setStageStep(5);
              } else {
                setStageStep(1);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
