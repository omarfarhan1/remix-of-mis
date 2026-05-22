import React, { Suspense, lazy } from 'react';
import { Company } from './types';
import { WelcomeView } from './views/WelcomeView';
import { ReturningView } from './views/ReturningView';
import { SectionFallback } from './components/SectionFallback';
// Stage 4 (final dashboard) is only reachable after completing the full
// workflow — lazy-load to defer its bundle until then.
const Stage4View = lazy(() =>
  import('./views/Stage4View').then(m => ({ default: m.Stage4View }))
);
import { StageShell } from './views/StageShell';
// Intelligence Hub is a heavy side panel that is closed by default and only
// triggered by the floating action button on stages 1-3.
const IntelligenceHub = lazy(() =>
  import('./components/IntelligenceHub').then(m => ({ default: m.IntelligenceHub }))
);
import { Brain, Check, AlertCircle, X } from 'lucide-react';
import { cn } from './lib/utils';
// Modals are mounted in the tree but only render content when open. Lazy
// loading keeps their (large) form/editor code out of the initial bundle.
const ConflictModal = lazy(() =>
  import('./components/ConflictModal').then(m => ({ default: m.ConflictModal }))
);
const FormulaEditorModal = lazy(() =>
  import('./components/FormulaEditorModal').then(m => ({ default: m.FormulaEditorModal }))
);
const CompanyEditorModal = lazy(() =>
  import('./components/CompanyEditorModal').then(m => ({ default: m.CompanyEditorModal }))
);
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import {
  useTheme,
  useThemeControls,
  useHubOpen,
  useHubControls,
  useFormulaModal,
  useCompanyModal,
  useConflictModal,
  useToasts,
} from './stores/uiStore';
import {
  useCompanies,
  useActiveCompanyId,
  useDraftCompany,
  useCompanyActions,
} from './stores/companyStore';
import {
  useOffers,
  useProgress,
  useDraftOffer,
  useTransientResultOffer,
  useIsGenerating,
  useOfferActions,
} from './stores/offerStore';
import { useCurrentView, useWorkflowActions } from './stores/workflowStore';
import { useWorkflowOrchestration } from './hooks/useWorkflowOrchestration';

/**
 * App
 *
 * Slim top-level component. Responsibilities:
 *   1. Hydrate persistent stores on first mount.
 *   2. Compose the chrome shell (Intelligence Hub trigger, toasts, modals).
 *   3. Route to the active view (Welcome / Returning / Stage4 / StageShell).
 *
 * All cross-store orchestration lives in {@link useWorkflowOrchestration}.
 */
export default function App() {
  // UI chrome
  const theme = useTheme();
  const { toggleTheme } = useThemeControls();
  const isHubOpen = useHubOpen();
  const { openHub, closeHub } = useHubControls();
  const { isOpen: showFormulaModal, close: closeFormulaModal } = useFormulaModal();
  const { isOpen: showCompanyModal, close: closeCompanyModal } = useCompanyModal();
  const { isOpen: showConflictModal, pendingSaveType, close: closeConflictModal } = useConflictModal();
  const { successToast: showSuccessToast, errorToast: showErrorToast, dismissError } = useToasts();

  // Company / offer state needed by the shell + modals
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const draftCompany = useDraftCompany();
  const { setDraftCompany, hydrate: hydrateCompanyStore } = useCompanyActions();

  const offers = useOffers();
  const progress = useProgress();
  const draftOffer = useDraftOffer();
  const transientResultOffer = useTransientResultOffer();
  const isGenerating = useIsGenerating();
  const {
    setDraftOffer,
    setTransientResultOffer,
    hydrate: hydrateOfferStore,
  } = useOfferActions();

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Workflow nav
  const currentView = useCurrentView();
  const { setCurrentView } = useWorkflowActions();

  // Cross-store orchestration handlers
  const {
    handleSelectCompany,
    handleStartStage1,
    handleFinishStage1,
    saveCompany,
    handleDeleteCompany,
    handleEditCompanyFromHome,
    handleStartStage2,
    handleGenerateOffer,
    handleConsolidateOffer,
    handleDuplicateProjectFromOffer,
    handleUpdateAvatar,
    handleCompleteAvatars,
    handleProceedAfterSynthesis,
    handleNavigateToStage,
  } = useWorkflowOrchestration();

  // First-load hydration from IndexedDB. Stores own their persistence; App
  // only branches on first-run vs. returning visitor.
  React.useEffect(() => {
    const initStorage = async () => {
      const [{ companies: savedCompanies }] = await Promise.all([
        hydrateCompanyStore(),
        hydrateOfferStore(),
      ]);
      if (savedCompanies.length > 0 && currentView === 'welcome') {
        setCurrentView('returning');
      }
    };
    initStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderMainContent = () => {
    if (currentView === 'welcome' && companies.length === 0) {
      return <WelcomeView onStart={handleStartStage1} />;
    }

    if (currentView === 'returning') {
      return (
        <ReturningView
          onSelectCompany={(id) => handleSelectCompany(id)}
          onEditCompany={handleEditCompanyFromHome}
          onDeleteCompany={handleDeleteCompany}
          onAddNewCompany={handleStartStage1}
        />
      );
    }

    if (currentView === 'stage4') {
      return (
        <Suspense fallback={<SectionFallback label="Loading Results" />}>
          <Stage4View />
        </Suspense>
      );
    }

    return (
      <StageShell
        onStartStage1={handleStartStage1}
        onSelectCompany={handleSelectCompany}
        onNavigateToStage={handleNavigateToStage}
        onProceedAfterSynthesis={handleProceedAfterSynthesis}
        onFinishStage1={handleFinishStage1}
        onStartStage2={() => handleStartStage2()}
        onGenerateOffer={handleGenerateOffer}
        onCompleteAvatars={handleCompleteAvatars}
      />
    );
  };

  return (
    <ErrorBoundary name="App">
      <div className={cn(
        "h-screen bg-[var(--color-primary-bg)] flex overflow-hidden matrix-grid transition-all duration-700",
        theme === 'dark' ? "dark" : ""
      )}>
        {/* Intelligence Hub side panel */}
        <IntelligenceHub
          isOpen={isHubOpen}
          onClose={() => closeHub()}
          companies={companies}
          offers={offers}
          companyProgress={progress}
          theme={theme}
          onToggleTheme={toggleTheme}
          onSelectCompany={(id) => handleSelectCompany(id)}
          onConsolidateOffer={handleConsolidateOffer}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <div className="flex-1 flex flex-col min-w-0 relative">
          {/* Floating Intelligence Hub trigger */}
          {['stage1', 'stage2', 'stage3'].includes(currentView) && !isHubOpen && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => openHub()}
              className="fixed bottom-10 left-10 w-16 h-16 bg-[#1D1D1F] shadow-2xl rounded-[22px] flex items-center justify-center z-50 text-white hover:scale-110 active:scale-95 transition-all group border border-white/10"
            >
              <Brain size={28} strokeWidth={2} className="text-white group-hover:rotate-12 transition-transform duration-500" />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#0071E3] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#1D1D1F] shadow-[0_0_15px_#0071E3]/40">
                {companies.length}
              </div>
              <div className="absolute left-full ml-4 px-4 py-2 bg-white/80 backdrop-blur-md text-[#1D1D1F] text-[10px] font-black rounded-full opacity-0 group-hover:opacity-100 transition-all whitespace-nowrap pointer-events-none uppercase tracking-[0.2em] border border-[#D2D2D7]/30 shadow-xl translate-x-2 group-hover:translate-x-0">
                Intelligence Hub
              </div>
            </motion.button>
          )}

          <div className="flex-1 flex flex-col overflow-y-auto">
            {renderMainContent()}
          </div>

          <AnimatePresence>
            {showSuccessToast && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[1000] bg-[#1D1D1F] text-white px-8 py-4 rounded-full shadow-[0_30px_60px_rgba(0,0,0,0.25)] flex items-center gap-4 border border-white/10"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgb(16,185,129,0.4)]">
                  <Check size={14} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-[14px] font-bold tracking-tight uppercase tracking-widest text-[11px]">{showSuccessToast}</span>
              </motion.div>
            )}
            {showErrorToast && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[3000] bg-rose-600 text-white p-6 rounded-[32px] shadow-[0_30px_80px_rgba(225,29,72,0.4)] flex items-center gap-6 border border-white/20 max-w-[90vw]"
              >
                <AlertCircle size={24} className="shrink-0" />
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 leading-none">Intelligence System Alert</div>
                  <p className="text-[14px] font-bold leading-tight line-clamp-3">{showErrorToast}</p>
                </div>
                <button
                  onClick={() => dismissError()}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors ml-2 shrink-0 border border-white/10"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ConflictModal
          isOpen={showConflictModal}
          onClose={() => closeConflictModal()}
          onOverwrite={() => {
            if (pendingSaveType === 'company') saveCompany(false);
            if (pendingSaveType === 'offer') handleGenerateOffer(true);
          }}
          onCreateNew={() => {
            if (pendingSaveType === 'company') saveCompany(true);
            if (pendingSaveType === 'offer') handleDuplicateProjectFromOffer();
          }}
          title={pendingSaveType === 'company' ? "Update Company Profile?" : "Update Offer Formula?"}
          description={pendingSaveType === 'company' ? "You've changed your company details. Overwrite the original profile or save as a new project?" : "You've changed your offer formula. Do you want to update the current offer or create a new project for this version?"}
        />

        <FormulaEditorModal
          isOpen={showFormulaModal}
          onClose={() => {
            closeFormulaModal();
            setTransientResultOffer(null);
          }}
          draftOffer={draftOffer}
          companyContext={activeCompany || undefined}
          onUpdateDraft={(k, v) => setDraftOffer(prev => ({ ...prev, [k]: v }))}
          onGenerate={() => { handleGenerateOffer(); }}
          isGenerating={isGenerating}
          resultOffer={transientResultOffer || undefined}
        />

        <CompanyEditorModal
          isOpen={showCompanyModal}
          onClose={() => closeCompanyModal()}
          draftCompany={draftCompany}
          isOfferComplete={activeCompanyId ? progress[activeCompanyId]?.stage2Complete : false}
          onUpdateDraft={(k, v) => setDraftCompany(prev => ({ ...prev, [k]: v }))}
          onSave={() => {
            closeCompanyModal();
            handleFinishStage1();
          }}
        />
      </div>
    </ErrorBoundary>
  );
}