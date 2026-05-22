import React from 'react';
import { StrategicScaling } from '../components/stage4/StrategicScaling';
import { TransitionWrapper } from '../components/TransitionWrapper';
import { useCompanies, useActiveCompanyId } from '../stores/companyStore';
import { useOffers, useProgress } from '../stores/offerStore';
import { useWorkflowActions } from '../stores/workflowStore';
import { useToastActions, useToasts } from '../stores/uiStore';

export function Stage4View() {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const offers = useOffers();
  const progress = useProgress();
  const { setCurrentView } = useWorkflowActions();
  const { showSuccess: showSuccessToastMsg } = useToastActions();
  const { dismissSuccess } = useToasts();

  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const currentOffer = activeCompanyId ? offers[activeCompanyId] : null;
  const currentAvatars = activeCompanyId ? (progress[activeCompanyId]?.avatars || []) : [];

  React.useEffect(() => {
    if (!activeCompany || !currentOffer) {
      setCurrentView('returning');
    }
  }, [activeCompany, currentOffer, setCurrentView]);

  if (!activeCompany || !currentOffer) return null;

  return (
    <TransitionWrapper id="stage4">
      <StrategicScaling
        company={activeCompany}
        offer={currentOffer}
        avatars={currentAvatars}
        onComplete={() => {
          showSuccessToastMsg('Strategic Blueprints Ready in Hub!');
          setTimeout(() => dismissSuccess(), 3500);
          setCurrentView('returning');
        }}
      />
    </TransitionWrapper>
  );
}
