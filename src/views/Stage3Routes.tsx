import React from 'react';
import { Avatar } from '../types';
import { AvatarMethodSelector } from '../components/stage3/AvatarMethodSelector';
import { AIGeneratedAvatarWizard } from '../components/stage3/AIGeneratedAvatarWizard';
import { useCompanies, useActiveCompanyId, useCompanyActions } from '../stores/companyStore';
import { useOffers, useProgress } from '../stores/offerStore';
import { useAvatarMethod, useWorkflowActions } from '../stores/workflowStore';
import { useStageInsights, useIsInsightsLoading, useInsightsActions } from '../stores/insightsStore';

interface Props {
  onCompleteAvatars: (avatars: Avatar[]) => void;
}

export function Stage3Routes({ onCompleteAvatars }: Props) {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const { setCompanies } = useCompanyActions();
  const offers = useOffers();
  const progress = useProgress();
  const avatarMethod = useAvatarMethod();
  const { setAvatarMethod } = useWorkflowActions();
  const stageInsights = useStageInsights();
  const isInsightsLoading = useIsInsightsLoading();
  const { loadStageInsights } = useInsightsActions();

  return (
    <div className="pt-4">
      {!avatarMethod ? (
        <AvatarMethodSelector onSelect={(m) => setAvatarMethod(m)} />
      ) : (
        avatarMethod === 'ai' && (
          <AIGeneratedAvatarWizard
            company={activeCompany!}
            offer={offers[activeCompanyId!]!}
            strategicReport={progress[activeCompanyId!]?.synthesisReports?.['Strategy']}
            onComplete={onCompleteAvatars}
            onBack={() => setAvatarMethod(null)}
            onUpdateCompany={(updated) => {
              setCompanies(prev => prev.map(c => c.id === updated.id ? updated : c));
            }}
            onAvatarsGenerated={(avatars) => {
              loadStageInsights('avatars', { avatars }, activeCompany!);
            }}
            onDeepDiveComplete={(avatar) => {
              loadStageInsights('deepdive', { avatar }, activeCompany!);
            }}
            insights={stageInsights[`${activeCompanyId}-avatars`] || stageInsights[`${activeCompanyId}-deepdive`] || []}
            isInsightsLoading={isInsightsLoading}
          />
        )
      )}
    </div>
  );
}
