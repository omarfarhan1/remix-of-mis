import React, { Suspense, lazy } from 'react';
import { AnimatePresence } from 'motion/react';
import { Avatar } from '../types';
import { ModuleHeader } from '../components/ModuleHeader';
import { PhaseNav } from '../components/PhaseNav';
import { TransitionWrapper } from '../components/TransitionWrapper';
import { ConsultantReport } from '../components/ConsultantReport';
import { SectionFallback } from '../components/SectionFallback';
import { Stage1Routes } from './Stage1Routes';
// Stage 2 and Stage 3 are gated behind explicit user progression — lazy load
// to keep them out of the initial bundle. Stage 1 stays eager because it is
// reachable on first interaction from the Welcome view.
const Stage2Routes = lazy(() =>
  import('./Stage2Routes').then(m => ({ default: m.Stage2Routes }))
);
const Stage3Routes = lazy(() =>
  import('./Stage3Routes').then(m => ({ default: m.Stage3Routes }))
);
import { endWizardSession } from '../services/offerWizardService';
import { useCompanies, useActiveCompanyId } from '../stores/companyStore';
import { useProgress } from '../stores/offerStore';
import {
  useCurrentView,
  useStageStep,
  useWorkflowActions,
} from '../stores/workflowStore';
import { useTheme, useThemeControls } from '../stores/uiStore';
import {
  useIsSynthesizing,
  useSynthesisReport,
  useSynthesisStage,
  useSynthesisActions,
} from '../stores/synthesisStore';

interface Props {
  onStartStage1: () => void;
  onSelectCompany: (id: string, phase?: 'company' | 'offer' | 'avatar') => void;
  onNavigateToStage: (
    view: 'stage1' | 'stage2' | 'stage3' | 'stage4',
    phase?: 'company' | 'offer' | 'avatar'
  ) => void;
  onProceedAfterSynthesis: () => void;
  onFinishStage1: () => void;
  onStartStage2: () => void;
  onGenerateOffer: (forceOverwrite?: boolean) => void;
  onCompleteAvatars: (avatars: Avatar[]) => void;
}

export function StageShell({
  onStartStage1,
  onSelectCompany,
  onNavigateToStage,
  onProceedAfterSynthesis,
  onFinishStage1,
  onStartStage2,
  onGenerateOffer,
  onCompleteAvatars,
}: Props) {
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  const progress = useProgress();
  const currentView = useCurrentView();
  const stageStep = useStageStep();
  const { setCurrentView } = useWorkflowActions();
  const theme = useTheme();
  const { toggleTheme } = useThemeControls();
  const isSynthesizing = useIsSynthesizing();
  const synthesisReport = useSynthesisReport();
  const synthesisStage = useSynthesisStage();
  const { reset: resetSynthesis } = useSynthesisActions();

  const moduleName =
    currentView === 'stage1'
      ? 'Company Profile'
      : currentView === 'stage2'
      ? 'Offer Builder'
      : 'Empathy Architect';

  return (
    <>
      <ModuleHeader
        moduleName={moduleName}
        company={activeCompany}
        allCompanies={companies}
        onSelectCompany={(id) => onSelectCompany(id)}
        onAddCompany={onStartStage1}
        theme={theme}
        onToggleTheme={toggleTheme}
        onGoHome={() => {
          endWizardSession();
          setCurrentView('returning');
        }}
      />

      {activeCompany && (
        <PhaseNav
          currentView={currentView as any}
          currentStep={stageStep}
          progress={progress[activeCompany.id]}
          onNavigate={(view, phase) => {
            onNavigateToStage(view as any, phase as any);
          }}
        />
      )}

      <main className="flex-1 overflow-y-auto relative flex flex-col">
        <AnimatePresence mode="wait">
          {isSynthesizing ? (
            <TransitionWrapper id="synthesis" key="synthesis">
              <ConsultantReport
                report={synthesisReport}
                isLoading={!synthesisReport}
                stageName={synthesisStage}
                onProceed={onProceedAfterSynthesis}
                onBack={() => {
                  resetSynthesis();
                }}
              />
            </TransitionWrapper>
          ) : (
            <TransitionWrapper id={`${currentView}-${stageStep}`} key={`${currentView}-${stageStep}`}>
              {currentView === 'stage1' && (
                <Stage1Routes
                  onFinishStage1={onFinishStage1}
                  onStartStage1={onStartStage1}
                  onStartStage2={onStartStage2}
                />
              )}
              {currentView === 'stage2' && (
                <Suspense fallback={<SectionFallback label="Loading Offer Builder" />}>
                  <Stage2Routes onGenerateOffer={onGenerateOffer} />
                </Suspense>
              )}
              {currentView === 'stage3' && (
                <Suspense fallback={<SectionFallback label="Loading Empathy Architect" />}>
                  <Stage3Routes onCompleteAvatars={onCompleteAvatars} />
                </Suspense>
              )}
            </TransitionWrapper>
          )}
        </AnimatePresence>
      </main>
    </>
  );
}
