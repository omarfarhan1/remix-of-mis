import React from 'react';
import { Company, Offer, Progress, Specialization, Avatar } from './types';
import { Stage1Routes } from './views/Stage1Routes';
import { Stage2Routes } from './views/Stage2Routes';
import { Stage3Routes } from './views/Stage3Routes';
import { ReturningUserScreen } from './components/ReturningUserScreen';
import { IntelligenceHub } from './components/IntelligenceHub';
import { Brain, ChevronRight, Check, AlertCircle, X } from 'lucide-react';
import { ModuleHeader } from './components/ModuleHeader';
import { PhaseNav } from './components/PhaseNav';
import { cn } from './lib/utils';
import { StrategicScaling } from './components/stage4/StrategicScaling';
import { generateAIContent } from './services/aiService';
import { consolidateOffer, computeOfferScore } from './services/offerService';
import { startOfferWizardSession, endWizardSession } from './services/offerWizardService';
import { addToEditHistory, updateIndustryIntelligence } from './services/historyService';
import { generateScoreDelta, rankAvatarsForDisplay } from './services/intelligenceService';
import { validateInputQuality } from './services/validationService';
import { generateInitialAvatars } from './services/avatarService';
import { ConflictModal } from './components/ConflictModal';
import { FormulaEditorModal } from './components/FormulaEditorModal';
import { CompanyEditorModal } from './components/CompanyEditorModal';
import { TransitionWrapper } from './components/TransitionWrapper';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';



import { ConsultantReport } from './components/ConsultantReport';
import { generateStage1Synthesis, generateStage2Synthesis, generateStage3Synthesis, SynthesisReport } from './services/synthesisService';
import { StorageManager, STORAGE_KEYS, exportSessionData, importSessionData } from './lib/storage';
import {
  useUIStore,
  useTheme,
  useThemeControls,
  useHubOpen,
  useHubControls,
  useFormulaModal,
  useCompanyModal,
  useConflictModal,
  useToasts,
  useToastActions,
} from './stores/uiStore';
import {
  useCompanies,
  useActiveCompanyId,
  useDraftCompany,
  useNeedsOfferUpdate,
  useCompanyActions,
} from './stores/companyStore';
import {
  useOffers,
  useProgress,
  useDraftOffer,
  useTransientResultOffer,
  useIsGenerating,
  useGenerationError,
  useOfferActions,
} from './stores/offerStore';
import {
  useIsSynthesizing,
  useSynthesisReport,
  useSynthesisStage,
  useSynthesisActions,
} from './stores/synthesisStore';
import {
  useCurrentView,
  useStageStep,
  useAvatarMethod,
  useWorkflowActions,
} from './stores/workflowStore';
import {
  useStageInsights,
  useIsInsightsLoading,
  useInsightsActions,
} from './stores/insightsStore';

export default function App() {
  // UI State (theme, modals, toasts, hub) lives in uiStore.
  const theme = useTheme();
  const { toggleTheme } = useThemeControls();
  const isHubOpen = useHubOpen();
  const { openHub, closeHub } = useHubControls();
  const { isOpen: showFormulaModal, open: openFormulaModal, close: closeFormulaModal } = useFormulaModal();
  const { isOpen: showCompanyModal, open: openCompanyModal, close: closeCompanyModal } = useCompanyModal();
  const { isOpen: showConflictModal, pendingSaveType, open: openConflictModal, close: closeConflictModal } = useConflictModal();
  const { successToast: showSuccessToast, errorToast: showErrorToast, dismissError, dismissSuccess } = useToasts();
  const { showSuccess: showSuccessToastMsg, showError: showErrorToastMsg } = useToastActions();

  // Persistence State — companies / activeCompanyId / draftCompany / needsOfferUpdate
  // live in companyStore (Step 4). Persistence is handled inside the store.
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const draftCompany = useDraftCompany();
  const needsOfferUpdate = useNeedsOfferUpdate();
  const {
    setCompanies,
    setActiveCompanyId,
    setDraftCompany,
    setNeedsOfferUpdate,
    markNeedsOfferUpdate,
    clearNeedsOfferUpdate,
    hydrate: hydrateCompanyStore,
  } = useCompanyActions();

  // Offer domain — offers / progress / draftOffer / runtime gen flags now in offerStore (Step 5).
  const offers = useOffers();
  const progress = useProgress();
  const draftOffer = useDraftOffer();
  const transientResultOffer = useTransientResultOffer();
  const isGenerating = useIsGenerating();
  const generationError = useGenerationError();
  const {
    setOffers,
    setProgress,
    setDraftOffer,
    setTransientResultOffer,
    setIsGenerating,
    setGenerationError,
    removeCompanyData,
    hydrate: hydrateOfferStore,
  } = useOfferActions();

  const activeCompany = companies.find(c => c.id === activeCompanyId);


  // Navigation / workflow — currentView / stageStep / avatarMethod now in
  // workflowStore (Step 8). No persistence, identical session-local behavior.
  const currentView = useCurrentView();
  const stageStep = useStageStep();
  const avatarMethod = useAvatarMethod();
  const {
    setCurrentView,
    setStageStep,
    setAvatarMethod,
  } = useWorkflowActions();

  // Synthesis domain — state + abort/staleness primitives in synthesisStore (Step 7).
  const isSynthesizing = useIsSynthesizing();
  const synthesisReport = useSynthesisReport();
  const synthesisStage = useSynthesisStage();
  const {
    beginRequest: beginSynthesisRequest,
    setIsSynthesizing,
    setSynthesisReport,
    reset: resetSynthesis,
  } = useSynthesisActions();

  // Load from Storage (IndexedDB Migration). Company and offer domains are
  // hydrated by their respective stores; App only branches on first-run vs returning.
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
  }, []);

  // Insights domain — stageInsights + isInsightsLoading in insightsStore (Step 9).
  const stageInsights = useStageInsights();
  const isInsightsLoading = useIsInsightsLoading();
  const { loadStageInsights } = useInsightsActions();

  // Actions
  const handleSelectCompany = (id: string, phase?: 'company' | 'offer' | 'avatar') => {
    const comp = companies.find(c => c.id === id);
    const compProgress = progress[id];
    
    // Invariant Validation & Route Guards
    if (!comp) {
        console.error("Attempted to select non-existent company:", id);
        setCurrentView('welcome');
        return;
    }

    setActiveCompanyId(id);
    setDraftCompany(comp);
    
    if (phase === 'company') {
        setCurrentView('stage1');
        setStageStep(1);
    } else if (phase === 'offer') {
        const hasResult = compProgress?.stage2Complete;
        setDraftOffer(offers[id] || { product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
        setCurrentView('stage2');
        setStageStep(hasResult ? 6 : 1);
    } else if (phase === 'avatar') {
        setCurrentView('stage3');
        setStageStep(1);
    } else {
        // Auto-detect based on progress
        if (compProgress?.stage2Complete) {
            setDraftOffer(offers[id] || { product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
            setCurrentView('stage2');
            setStageStep(6);
        } else if (compProgress?.stage1Complete) {
            setDraftOffer({ product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
            setCurrentView('stage2');
            setStageStep(1);
        } else {
            setCurrentView('stage1');
            setStageStep(1);
        }
    }
  };

  const handleStartStage1 = () => {
    setActiveCompanyId(null);
    setDraftCompany({ 
      name: '', 
      industry: '', 
      specializations: [], 
      usp: '',
      country: 'Global',
      websiteUrl: '',
      isGlobalMode: true
    });
    setStageStep(1);
    setCurrentView('stage1');
  };

  const checkCompanyChanges = () => {
    if (!activeCompany) return false;
    return (
      draftCompany.name !== activeCompany.name ||
      draftCompany.industry !== activeCompany.industry ||
      JSON.stringify(draftCompany.specializations) !== JSON.stringify(activeCompany.specializations) ||
      draftCompany.usp !== activeCompany.usp
    );
  };

  const saveCompany = (asNew: boolean) => {
    const cid = asNew ? crypto.randomUUID() : (activeCompanyId || crypto.randomUUID());
    
    // Check if core info changed to flag offer update
    if (!asNew && activeCompanyId && activeCompany) {
        const coreChanged = (
            draftCompany.name !== activeCompany.name ||
            draftCompany.industry !== activeCompany.industry
        );
        if (coreChanged && progress[activeCompanyId]?.stage2Complete) {
            markNeedsOfferUpdate(activeCompanyId);
        }
    }

    const newCompany: Company = {
      id: cid,
      name: draftCompany.name || 'Unnamed',
      industry: draftCompany.industry || '',
      logoUrl: draftCompany.logoUrl || '',
      specializations: draftCompany.specializations || [],
      usp: draftCompany.usp || '',
      country: draftCompany.country || 'Global',
      websiteUrl: draftCompany.websiteUrl || '',
      isGlobalMode: draftCompany.country === 'Global',
      createdAt: asNew ? new Date().toISOString() : (activeCompany?.createdAt || new Date().toISOString())
    };
    
    if (asNew || !activeCompanyId) {
      setCompanies(prev => [...prev, newCompany]);
      setActiveCompanyId(newCompany.id);
      setProgress(prev => ({
        ...prev,
        [newCompany.id]: { stage1Complete: true, stage2Complete: false, stage3Complete: false }
      }));
      
      if (currentView === 'returning') {
        showSuccessToastMsg("Project duplicated successfully!");
        setTimeout(() => dismissSuccess(), 3000);
      } else {
        // Deterministic Start: Pass the object directly to avoid stale state in handleStartSynthesis
        handleStartSynthesis('Identity', newCompany);
        loadStageInsights('company', newCompany, newCompany);
      }
    } else {
      setCompanies(prev => prev.map(c => c.id === activeCompanyId ? newCompany : c));
      if (currentView === 'stage1') {
        handleStartSynthesis('Identity', newCompany);
      } else {
        showSuccessToastMsg("Project updated successfully!");
        setTimeout(() => dismissSuccess(), 3000);
      }
    }
    
    closeConflictModal();
  };

  const handleStartSynthesis = async (stage: string, overrideCompany?: Company, overrideOffer?: Offer, overrideAvatars?: Avatar[]) => {
    // synthesisStore handles abort + timestamp + reactive state transitions.
    const request = beginSynthesisRequest(stage);

    try {
      let report: SynthesisReport;
      const targetCompany = overrideCompany || companies.find(c => c.id === activeCompanyId) || draftCompany;

      if (!targetCompany) {
        throw new Error("No target company found for synthesis");
      }

      const companyData = targetCompany as Company;

      if (stage === 'Identity') {
         report = await generateStage1Synthesis(companyData, request.signal);
      } else if (stage === 'Strategy' && activeCompanyId) {
         const targetOffer = overrideOffer || offers[activeCompanyId];
         if (!targetOffer) throw new Error("No strategy data found for analysis");
         report = await generateStage2Synthesis(companyData, targetOffer, request.signal);
      } else if (stage === 'Modeling' && activeCompanyId) {
         const targetAvatars = overrideAvatars || progress[activeCompanyId]?.avatars || [];
         report = await generateStage3Synthesis(companyData, targetAvatars, request.signal);
      } else {
         throw new Error("Invalid stage for synthesis or missing data");
      }

      // Discard if this isn't the most recent request or it was aborted
      if (!request.isLatest()) {
        console.log("Strategic synthesis request discarded (stale or aborted).");
        return;
      }

      setSynthesisReport(report);
    } catch (err: any) {
      // Gracefully handle manual aborts
      const isAbort =
        err.name === 'AbortError' ||
        err.name === 'CanceledError' ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('canceled') ||
        request.signal.aborted;

      if (isAbort) {
        return;
      }

      console.error("Synthesis failed:", err);

      const errorMessage = err.message || "An unexpected strategic error occurred.";
      const isQuota = errorMessage.includes('429') || errorMessage.includes('quota');
      const isOverloaded = errorMessage.includes('503') || err.status === 503;

      if (isQuota) {
        showErrorToastMsg("Intelligence quota reached. Please pause for 60 seconds before re-engaging.");
      } else if (isOverloaded) {
        showErrorToastMsg("Intelligence server is heavily loaded. Attempting automatic recovery...");
      } else {
        showErrorToastMsg(`Strategy Analysis Interrupted: ${errorMessage}`);
      }

      if (request.isLatest()) {
        setIsSynthesizing(false);
      }
    }
  };

  const handleProceedAfterSynthesis = () => {
    setIsSynthesizing(false);
    if (activeCompanyId && synthesisReport) {
      setProgress(prev => ({
        ...prev,
        [activeCompanyId]: {
          ...prev[activeCompanyId],
          synthesisReports: {
            ...prev[activeCompanyId]?.synthesisReports,
            [synthesisStage]: synthesisReport
          }
        }
      }));
    }

    if (synthesisStage === 'Identity') {
      setStageStep(5); // Success Screen
    } else if (synthesisStage === 'Strategy') {
      setStageStep(6); // Result screen
    } else if (synthesisStage === 'Modeling') {
      setCurrentView('returning');
      showSuccessToastMsg("Customer Avatars saved to Intelligence Hub!");
      setTimeout(() => dismissSuccess(), 3500);
    }
    setSynthesisReport(null);
  };

  const handleFinishStage1 = () => {
    if (activeCompanyId && checkCompanyChanges()) {
      openConflictModal('company');
      return;
    }
    saveCompany(false);
  };

  const handleStartStage2 = (id?: string) => {
    const targetId = id || activeCompanyId;
    if (targetId) {
        setActiveCompanyId(targetId);
        const targetComp = companies.find(c => c.id === targetId);
        if (targetComp) {
            startOfferWizardSession(targetComp);
        }
        const existingOffer = offers[targetId];
        if (existingOffer) {
            setDraftOffer(existingOffer);
            setStageStep(6);
        } else {
            setDraftOffer({ product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
            setStageStep(1);
        }
        setCurrentView('stage2');
    }
  };

  const checkOfferChanges = () => {
    const existingOffer = offers[activeCompanyId || ''];
    if (!existingOffer) return false;
    return (
      draftOffer.product !== existingOffer.product ||
      draftOffer.relevance !== existingOffer.relevance ||
      draftOffer.reason !== existingOffer.reason ||
      draftOffer.audience !== existingOffer.audience ||
      draftOffer.transformation !== existingOffer.transformation
    );
  };

  const handleGenerateOffer = async (forceOverwrite = false, overrideId?: string) => {
    const targetCompId = overrideId || activeCompanyId;
    const targetComp = companies.find(c => c.id === targetCompId);
    
    if (!targetComp) {
      console.error("No target company found for generation");
      return;
    }

    if (!forceOverwrite && offers[targetComp.id] && checkOfferChanges()) {
      openConflictModal('offer');
      return;
    }
    
    setIsGenerating(true);
    setGenerationError(null);
    
    try {
      const promptContent = `
        Company: ${targetComp.name}
        Industry: ${targetComp.industry}
        Specializations: ${targetComp.specializations.map(s => s.name).join(', ')}
        USP: ${targetComp.usp || "not specified"}

        Offer Formula:
        - Product/Service: ${draftOffer.product}
        - Relevance: ${draftOffer.relevance}
        - Reason to Act: ${draftOffer.reason}
        - Target Audience: ${draftOffer.audience}
        - Transformation: ${draftOffer.transformation}

        Write a powerful, persuasive marketing offer (3–5 sentences). Requirements:
        1. State clearly what the product/service is
        2. Connect to the audience's current situation or pain point
        3. Include urgency or reason to act now
        4. Paint the transformation — before and after
        5. Sound confident and natural — not salesy or generic
      `;

      const resultText = await generateAIContent({
        systemPrompt: `You are an expert direct-response marketing copywriter. Return ONLY the offer copy. No labels. No explanation. No markdown.${
          progress[targetComp.id]?.synthesisReports?.['Identity'] 
            ? `\n\nCONSULTANT FEEDBACK ON BRAND IDENTITY:\n- Strengths: ${progress[targetComp.id]?.synthesisReports?.['Identity']?.strengths.join(', ')}\n- Critical Gaps: ${progress[targetComp.id]?.synthesisReports?.['Identity']?.weaknesses.join(', ')}\n- Strategic Advice: ${progress[targetComp.id]?.synthesisReports?.['Identity']?.recommendations.join(', ')}`
            : ""
        }`,
        userMessage: promptContent
      });

      if (!resultText) {
        throw new Error("The AI returned an empty response. Please try adjusting your formula inputs.");
      }

      const newOffer: Offer = {
        companyId: targetComp.id,
        product: draftOffer.product || '',
        relevance: draftOffer.relevance || '',
        reason: draftOffer.reason || '',
        audience: draftOffer.audience || '',
        transformation: draftOffer.transformation || '',
        generatedOffer: resultText,
        generatedAt: new Date().toISOString()
      };

      const scoredOffer = await computeOfferScore(targetComp, newOffer);
      
      // Track score improvement if applicable
      const existingOffer = offers[targetComp.id];
      if (existingOffer && existingOffer.score && scoredOffer.score && scoredOffer.score.total > existingOffer.score.total) {
        addToEditHistory({
          field: 'generatedOffer',
          before: existingOffer.generatedOffer,
          after: scoredOffer.generatedOffer,
          industry: targetComp.industry,
          timestamp: new Date().toISOString(),
          type: 'score_improvement',
          deltaScore: scoredOffer.score.total - existingOffer.score.total
        });
      }

      setOffers(prev => ({ ...prev, [targetComp.id]: scoredOffer }));
      setTransientResultOffer(resultText);
      clearNeedsOfferUpdate(targetComp.id);
      setProgress(prev => ({
        ...prev,
        [targetComp.id]: { ...prev[targetComp.id], stage1Complete: true, stage2Complete: true }
      }));
      
      handleStartSynthesis('Strategy', targetComp, scoredOffer);
      
      // Trigger stage 2 insights
      loadStageInsights('offer', scoredOffer, targetComp);
    } catch (err: any) {
      console.error("Offer Generation Error:", err);
      // Handle rate limits and server busy
      if (err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('limit')) {
        showErrorToastMsg("Model quota exceeded. Please wait a moment before trying again.");
      } else if (err?.message?.includes('503')) {
        showErrorToastMsg("Intelligence server is overloaded. Retrying once...");
      }
      setGenerationError(err.message || "Failed to generate offer. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateAvatar = (companyId: string, updatedAvatar: Avatar) => {
    setProgress(prev => {
      const p = prev[companyId];
      if (!p || !p.avatars) return prev;
      
      const exists = p.avatars.some((a: Avatar) => a.id === updatedAvatar.id);
      
      const updatedAvatars = exists 
        ? p.avatars.map((a: Avatar) => a.id === updatedAvatar.id ? updatedAvatar : a)
        : [...p.avatars, updatedAvatar];

      return {
        ...prev,
        [companyId]: {
          ...p,
          avatars: updatedAvatars
        }
      };
    });
  };

  const handleConsolidateOffer = async (companyId: string) => {
    const comp = companies.find(c => c.id === companyId);
    const currentOffer = offers[companyId];
    const compAvatars = progress[companyId]?.avatars || [];
    
    if (!comp || !currentOffer || compAvatars.length === 0) return;

    setIsGenerating(true);
    try {
      const improvedOffer = await consolidateOffer(comp, currentOffer, compAvatars);
      const deltaInsight = await generateScoreDelta(currentOffer, improvedOffer);
      
      setOffers(prev => ({ ...prev, [companyId]: improvedOffer }));
      setProgress(prev => ({
        ...prev,
        [companyId]: {
          ...prev[companyId],
          scoreDelta: deltaInsight
        }
      }));

      // Generate consolidated actionable insights
      loadStageInsights('consolidated', { 
        beforeScore: currentOffer.score?.total || 0,
        afterScore: improvedOffer.score?.total || 0,
        biggestGain: deltaInsight.biggestGain,
        weakestLink: deltaInsight.nextWeakLink,
        avatarsCount: compAvatars.length,
        unprocessedCount: 0,
        topAvatarDrilled: true
      }, comp);
      
      showSuccessToastMsg("Global offer improved using collective empathy intelligence!");
      setTimeout(() => dismissSuccess(), 4000);
    } catch (err: any) {
      console.error(err);
      alert("Failed to consolidate: " + (err.message || "Unknown error"));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNavigateToStage = (view: 'stage1' | 'stage2' | 'stage3' | 'stage4', phase?: 'company' | 'offer' | 'avatar') => {
    if (view === 'stage1' || phase === 'company') {
        const target = activeCompany;
        if (target) {
            setDraftCompany(target);
            setStageStep(1); 
        }
        setCurrentView('stage1');
    } else if (view === 'stage2' || phase === 'offer') {
        if (activeCompanyId) {
            const existingOffer = offers[activeCompanyId];
            if (existingOffer) {
                setDraftOffer(existingOffer);
                setStageStep(6);
            } else {
                setDraftOffer({ product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
                setStageStep(1);
            }
            setCurrentView('stage2');
        }
    } else if (view === 'stage3' || phase === 'avatar') {
        if (activeCompanyId) {
            setCurrentView('stage3');
            setStageStep(1);
            setAvatarMethod(null);
        }
    } else if (view === 'stage4') {
        if (activeCompanyId) {
            setCurrentView('stage4');
        }
    }
  };

  const handleCompleteAvatars = async (avatars: Avatar[]) => {
    if (!activeCompanyId) return;
    
    const comp = companies.find(c => c.id === activeCompanyId);
    if (comp) {
      updateIndustryIntelligence(comp, avatars, offers[activeCompanyId]);
      
      setIsGenerating(true);
      try {
        const rankedAvatars = await rankAvatarsForDisplay(avatars, comp);
        setProgress(prev => ({
          ...prev,
          [activeCompanyId]: {
            ...prev[activeCompanyId],
            stage3Complete: true,
            avatars: rankedAvatars
          }
        }));
      } catch (err) {
        console.error("Failed to rank avatars:", err);
        setProgress(prev => ({
          ...prev,
          [activeCompanyId]: {
            ...prev[activeCompanyId],
            stage3Complete: true,
            avatars
          }
        }));
      } finally {
        setIsGenerating(false);
      }

      handleStartSynthesis('Modeling', comp, undefined, avatars);
    }
  };

  const handleDeleteCompany = (id: string) => {
    const nextCompanies = companies.filter(c => c.id !== id);
    setCompanies(nextCompanies);

    removeCompanyData(id);

    if (nextCompanies.length === 0) {
        setCurrentView('welcome');
        setActiveCompanyId(null);
    } else if (activeCompanyId === id) {
        setActiveCompanyId(null);
        setCurrentView('returning');
    }
  };

  const handleDeleteAvatar = (companyId: string, avatarId: string) => {
    setProgress(prev => {
      const companyProgress = prev[companyId];
      if (!companyProgress) return prev;
      
      const avatars = companyProgress.avatars || [];
      
      // Recursive Cleanup: Find all descendants
      const getDescendantIds = (parentId: string): string[] => {
        const children = avatars.filter((a: Avatar) => a.parentId === parentId);
        let ids = children.map((c: Avatar) => c.id);
        children.forEach((c: Avatar) => {
          ids = [...ids, ...getDescendantIds(c.id)];
        });
        return ids;
      };

      const idsToDelete = [avatarId, ...getDescendantIds(avatarId)];
      
      return {
        ...prev,
        [companyId]: {
          ...companyProgress,
          avatars: avatars.filter((a: Avatar) => !idsToDelete.includes(a.id))
        }
      };
    });
  };

  const handleEditCompanyFromHome = (id: string, phase: 'company' | 'offer' | 'avatar') => {
    const company = companies.find(c => c.id === id);
    if (company) {
        setActiveCompanyId(id);
        if (phase === 'company') {
            closeFormulaModal();
            setDraftCompany(company);
            openCompanyModal();
        } else if (phase === 'offer') {
            closeCompanyModal();
            const existingOffer = offers[id];
            if (existingOffer) {
                setDraftOffer(existingOffer);
            } else {
                setDraftOffer({ product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
            }
            setTransientResultOffer(null);
            openFormulaModal();
        }
    }
  };

  // Views rendering
  const renderMainContent = () => {
    if (currentView === 'welcome' && companies.length === 0) {
      return (
        <TransitionWrapper id="welcome">
          <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[var(--color-bg-primary)] dark:bg-[#000000]">
              <motion.div
                  initial={{ scale: 0.8, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="w-32 h-32 mb-12 relative"
              >
                  <div className="absolute inset-0 bg-[#0071E3] rounded-[40px] rotate-6 opacity-10 animate-pulse" />
                  <div className="absolute inset-0 bg-[#0071E3] rounded-[40px] -rotate-3 opacity-5" />
                  <div className="relative w-full h-full bg-[#1D1D1F] dark:bg-[#111111] border border-white/5 rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#1D1D1F]/20">
                     <Brain className="text-white" size={48} strokeWidth={1.5} />
                  </div>
              </motion.div>
              
              <div className="space-y-6 max-w-[480px]">
                <h1 className="text-[56px] font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">Brand Matrix</h1>
                <p className="text-[20px] text-[#86868B] dark:text-[#A1A1A6] font-medium leading-relaxed">
                  The definitive workspace for architecting brand authority and segment-specific market strategies.
                </p>
                <div className="pt-8">
                  <button 
                    onClick={handleStartStage1} 
                    className="btn-primary px-12 py-4 text-[17px] group"
                  >
                    Start Building
                    <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
          </div>
        </TransitionWrapper>
      );
    }

    if (currentView === 'returning') {
      return (
        <TransitionWrapper id="returning">
          <ReturningUserScreen 
            companies={companies}
            companyProgress={progress}
            needsOfferUpdate={needsOfferUpdate}
            offers={offers}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSelectCompany={(id) => handleSelectCompany(id)}
            onEditCompany={handleEditCompanyFromHome}
            onDeleteCompany={handleDeleteCompany}
            onAddNewCompany={handleStartStage1}
            onDataImported={async () => {
                const [savedCompanies, savedOffers, savedProgress] = await Promise.all([
                  StorageManager.load(STORAGE_KEYS.COMPANIES, []),
                  StorageManager.load(STORAGE_KEYS.OFFERS, {}),
                  StorageManager.load(STORAGE_KEYS.PROGRESS, {})
                ]);
                setCompanies(savedCompanies);
                setOffers(savedOffers);
                setProgress(savedProgress);
                setNeedsOfferUpdate(await StorageManager.load(STORAGE_KEYS.NEEDS_OFFER_UPDATE, {}));
                showSuccessToastMsg("Intelligence Matrix Synchronized!");
                setTimeout(() => dismissSuccess(), 3500);
            }}
          />
        </TransitionWrapper>
      );
    }

    if (currentView === 'stage4') {
        const activeCompany = companies.find(c => c.id === activeCompanyId);
        const currentOffer = activeCompanyId ? offers[activeCompanyId] : null;
        const currentAvatars = activeCompanyId ? (progress[activeCompanyId]?.avatars || []) : [];

        if (!activeCompany || !currentOffer) {
            setCurrentView('returning');
            return null;
        }

        return (
            <TransitionWrapper id="stage4">
                <StrategicScaling 
                    company={activeCompany}
                    offer={currentOffer}
                    avatars={currentAvatars}
                    onComplete={() => {
                        showSuccessToastMsg("Strategic Blueprints Ready in Hub!");
                        setTimeout(() => dismissSuccess(), 3500);
                        setCurrentView('returning');
                    }}
                />
            </TransitionWrapper>
        );
    }

    return (
      <>
          <ModuleHeader 
              moduleName={currentView === 'stage1' ? "Company Profile" : currentView === 'stage2' ? "Offer Builder" : "Empathy Architect"} 
              company={activeCompany}
              allCompanies={companies}
              onSelectCompany={(id) => handleSelectCompany(id)}
              onAddCompany={handleStartStage1}
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
                      handleNavigateToStage(view as any, phase as any);
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
                      onProceed={handleProceedAfterSynthesis}
                      onBack={() => {
                        resetSynthesis();
                        // Stay on current stage to re-edit
                      }}
                    />
                  </TransitionWrapper>
                ) : (
                  <TransitionWrapper id={`${currentView}-${stageStep}`} key={`${currentView}-${stageStep}`}>
                    {currentView === 'stage1' && (
                      <Stage1Routes
                        onFinishStage1={handleFinishStage1}
                        onStartStage1={handleStartStage1}
                        onStartStage2={() => handleStartStage2()}
                      />
                    )}
                    {currentView === 'stage2' && (
                      <Stage2Routes onGenerateOffer={handleGenerateOffer} />
                    )}
                    {currentView === 'stage3' && (
                      <Stage3Routes onCompleteAvatars={handleCompleteAvatars} />
                    )}
                  </TransitionWrapper>
                )}
              </AnimatePresence>
          </main>
      </>
    );
  };

  return (
    <ErrorBoundary name="App">
      <div className={cn(
        "h-screen bg-[var(--color-primary-bg)] flex overflow-hidden matrix-grid transition-all duration-700",
        theme === 'dark' ? "dark" : ""
      )}>
          {/* Intelligence Hub as a Side Panel */}
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
              {/* Floating Intelligence Hub Trigger - Only hidden when Hub is open on desktop */}
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
              if (pendingSaveType === 'offer') {
                  const newCid = crypto.randomUUID();
                  const duplicatedCompany: Company = {
                      ...activeCompany!,
                      id: newCid,
                      createdAt: new Date().toISOString()
                  };
                  setCompanies([...companies, duplicatedCompany]);
                  setActiveCompanyId(newCid);
                  setProgress({...progress, [newCid]: { stage1Complete: true, stage2Complete: false, stage3Complete: false }});
                  closeConflictModal();
                  showSuccessToastMsg("Offer duplicated to new project!");
                  setTimeout(() => dismissSuccess(), 3500);
                  setTimeout(() => {
                      handleGenerateOffer(true, newCid); 
                  }, 100);
              }
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
              onUpdateDraft={(k, v) => setDraftOffer(prev => ({...prev, [k]: v}))}
              onGenerate={() => {
                  handleGenerateOffer();
              }}
              isGenerating={isGenerating}
              resultOffer={transientResultOffer || undefined}
          />

          <CompanyEditorModal 
              isOpen={showCompanyModal}
              onClose={() => closeCompanyModal()}
              draftCompany={draftCompany}
              isOfferComplete={activeCompanyId ? progress[activeCompanyId]?.stage2Complete : false}
              onUpdateDraft={(k, v) => setDraftCompany(prev => ({...prev, [k]: v}))}
              onSave={() => {
                  closeCompanyModal();
                  handleFinishStage1();
              }}
          />
      </div>
    </ErrorBoundary>
  );
}
