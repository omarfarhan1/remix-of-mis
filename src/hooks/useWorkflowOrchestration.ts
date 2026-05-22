import React from 'react';
import { Company, Offer, Avatar } from '../types';
import { generateAIContent } from '../services/aiService';
import { consolidateOffer, computeOfferScore } from '../services/offerService';
import { startOfferWizardSession } from '../services/offerWizardService';
import { addToEditHistory, updateIndustryIntelligence } from '../services/historyService';
import { generateScoreDelta, rankAvatarsForDisplay } from '../services/intelligenceService';
import {
  generateStage1Synthesis,
  generateStage2Synthesis,
  generateStage3Synthesis,
  SynthesisReport,
} from '../services/synthesisService';
import {
  useFormulaModal,
  useCompanyModal,
  useConflictModal,
  useToasts,
  useToastActions,
} from '../stores/uiStore';
import {
  useCompanies,
  useActiveCompanyId,
  useDraftCompany,
  useCompanyActions,
} from '../stores/companyStore';
import {
  useOffers,
  useProgress,
  useDraftOffer,
  useOfferActions,
} from '../stores/offerStore';
import {
  useSynthesisReport,
  useSynthesisStage,
  useSynthesisActions,
} from '../stores/synthesisStore';
import {
  useCurrentView,
  useWorkflowActions,
} from '../stores/workflowStore';
import { useInsightsActions } from '../stores/insightsStore';

/**
 * useWorkflowOrchestration
 *
 * Encapsulates cross-store orchestration logic that previously lived inline in App.tsx.
 * Handlers here coordinate updates across company / offer / synthesis / workflow / insights
 * / ui stores. Returns a stable bag of callbacks for the App shell + modals to wire up.
 */
export function useWorkflowOrchestration() {
  // UI
  const { open: openFormulaModal, close: closeFormulaModal } = useFormulaModal();
  const { open: openCompanyModal, close: closeCompanyModal } = useCompanyModal();
  const { open: openConflictModal, close: closeConflictModal } = useConflictModal();
  const { dismissSuccess } = useToasts();
  const { showSuccess: showSuccessToastMsg, showError: showErrorToastMsg } = useToastActions();

  // Company
  const companies = useCompanies();
  const activeCompanyId = useActiveCompanyId();
  const draftCompany = useDraftCompany();
  const {
    setCompanies,
    setActiveCompanyId,
    setDraftCompany,
    markNeedsOfferUpdate,
    clearNeedsOfferUpdate,
  } = useCompanyActions();

  // Offer
  const offers = useOffers();
  const progress = useProgress();
  const draftOffer = useDraftOffer();
  const {
    setOffers,
    setProgress,
    setDraftOffer,
    setTransientResultOffer,
    setIsGenerating,
    setGenerationError,
    removeCompanyData,
  } = useOfferActions();

  const activeCompany = companies.find(c => c.id === activeCompanyId);

  // Workflow nav
  const currentView = useCurrentView();
  const { setCurrentView, setStageStep, setAvatarMethod } = useWorkflowActions();

  // Synthesis
  const synthesisReport = useSynthesisReport();
  const synthesisStage = useSynthesisStage();
  const {
    beginRequest: beginSynthesisRequest,
    setIsSynthesizing,
    setSynthesisReport,
  } = useSynthesisActions();

  // Insights
  const { loadStageInsights } = useInsightsActions();

  const handleSelectCompany = (id: string, phase?: 'company' | 'offer' | 'avatar') => {
    const comp = companies.find(c => c.id === id);
    const compProgress = progress[id];

    if (!comp) {
      console.error('Attempted to select non-existent company:', id);
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
      isGlobalMode: true,
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

  const handleStartSynthesis = async (
    stage: string,
    overrideCompany?: Company,
    overrideOffer?: Offer,
    overrideAvatars?: Avatar[]
  ) => {
    const request = beginSynthesisRequest(stage);

    try {
      let report: SynthesisReport;
      const targetCompany = overrideCompany || companies.find(c => c.id === activeCompanyId) || draftCompany;
      if (!targetCompany) throw new Error('No target company found for synthesis');
      const companyData = targetCompany as Company;

      if (stage === 'Identity') {
        report = await generateStage1Synthesis(companyData, request.signal);
      } else if (stage === 'Strategy' && activeCompanyId) {
        const targetOffer = overrideOffer || offers[activeCompanyId];
        if (!targetOffer) throw new Error('No strategy data found for analysis');
        report = await generateStage2Synthesis(companyData, targetOffer, request.signal);
      } else if (stage === 'Modeling' && activeCompanyId) {
        const targetAvatars = overrideAvatars || progress[activeCompanyId]?.avatars || [];
        report = await generateStage3Synthesis(companyData, targetAvatars, request.signal);
      } else {
        throw new Error('Invalid stage for synthesis or missing data');
      }

      if (!request.isLatest()) {
        console.log('Strategic synthesis request discarded (stale or aborted).');
        return;
      }

      setSynthesisReport(report);
    } catch (err: any) {
      const isAbort =
        err.name === 'AbortError' ||
        err.name === 'CanceledError' ||
        err.message?.toLowerCase().includes('aborted') ||
        err.message?.toLowerCase().includes('canceled') ||
        request.signal.aborted;

      if (isAbort) return;

      console.error('Synthesis failed:', err);
      const errorMessage = err.message || 'An unexpected strategic error occurred.';
      const isQuota = errorMessage.includes('429') || errorMessage.includes('quota');
      const isOverloaded = errorMessage.includes('503') || err.status === 503;

      if (isQuota) {
        showErrorToastMsg('Intelligence quota reached. Please pause for 60 seconds before re-engaging.');
      } else if (isOverloaded) {
        showErrorToastMsg('Intelligence server is heavily loaded. Attempting automatic recovery...');
      } else {
        showErrorToastMsg(`Strategy Analysis Interrupted: ${errorMessage}`);
      }

      if (request.isLatest()) {
        setIsSynthesizing(false);
      }
    }
  };

  const saveCompany = (asNew: boolean) => {
    const cid = asNew ? crypto.randomUUID() : (activeCompanyId || crypto.randomUUID());

    if (!asNew && activeCompanyId && activeCompany) {
      const coreChanged =
        draftCompany.name !== activeCompany.name ||
        draftCompany.industry !== activeCompany.industry;
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
      createdAt: asNew ? new Date().toISOString() : (activeCompany?.createdAt || new Date().toISOString()),
    };

    if (asNew || !activeCompanyId) {
      setCompanies(prev => [...prev, newCompany]);
      setActiveCompanyId(newCompany.id);
      setProgress(prev => ({
        ...prev,
        [newCompany.id]: { stage1Complete: true, stage2Complete: false, stage3Complete: false },
      }));

      if (currentView === 'returning') {
        showSuccessToastMsg('Project duplicated successfully!');
        setTimeout(() => dismissSuccess(), 3000);
      } else {
        handleStartSynthesis('Identity', newCompany);
        loadStageInsights('company', newCompany, newCompany);
      }
    } else {
      setCompanies(prev => prev.map(c => c.id === activeCompanyId ? newCompany : c));
      if (currentView === 'stage1') {
        handleStartSynthesis('Identity', newCompany);
      } else {
        showSuccessToastMsg('Project updated successfully!');
        setTimeout(() => dismissSuccess(), 3000);
      }
    }

    closeConflictModal();
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
            [synthesisStage]: synthesisReport,
          },
        },
      }));
    }

    if (synthesisStage === 'Identity') {
      setStageStep(5);
    } else if (synthesisStage === 'Strategy') {
      setStageStep(6);
    } else if (synthesisStage === 'Modeling') {
      setCurrentView('returning');
      showSuccessToastMsg('Customer Avatars saved to Intelligence Hub!');
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
    if (!targetId) return;
    setActiveCompanyId(targetId);
    const targetComp = companies.find(c => c.id === targetId);
    if (targetComp) startOfferWizardSession(targetComp);
    const existingOffer = offers[targetId];
    if (existingOffer) {
      setDraftOffer(existingOffer);
      setStageStep(6);
    } else {
      setDraftOffer({ product: '', relevance: '', reason: '', audience: '', transformation: '' } as any);
      setStageStep(1);
    }
    setCurrentView('stage2');
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
      console.error('No target company found for generation');
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
        USP: ${targetComp.usp || 'not specified'}

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
            : ''
        }`,
        userMessage: promptContent,
      });

      if (!resultText) {
        throw new Error('The AI returned an empty response. Please try adjusting your formula inputs.');
      }

      const newOffer: Offer = {
        companyId: targetComp.id,
        product: draftOffer.product || '',
        relevance: draftOffer.relevance || '',
        reason: draftOffer.reason || '',
        audience: draftOffer.audience || '',
        transformation: draftOffer.transformation || '',
        generatedOffer: resultText,
        generatedAt: new Date().toISOString(),
      };

      const scoredOffer = await computeOfferScore(targetComp, newOffer);

      const existingOffer = offers[targetComp.id];
      if (existingOffer && existingOffer.score && scoredOffer.score && scoredOffer.score.total > existingOffer.score.total) {
        addToEditHistory({
          field: 'generatedOffer',
          before: existingOffer.generatedOffer,
          after: scoredOffer.generatedOffer,
          industry: targetComp.industry,
          timestamp: new Date().toISOString(),
          type: 'score_improvement',
          deltaScore: scoredOffer.score.total - existingOffer.score.total,
        });
      }

      setOffers(prev => ({ ...prev, [targetComp.id]: scoredOffer }));
      setTransientResultOffer(resultText);
      clearNeedsOfferUpdate(targetComp.id);
      setProgress(prev => ({
        ...prev,
        [targetComp.id]: { ...prev[targetComp.id], stage1Complete: true, stage2Complete: true },
      }));

      handleStartSynthesis('Strategy', targetComp, scoredOffer);
      loadStageInsights('offer', scoredOffer, targetComp);
    } catch (err: any) {
      console.error('Offer Generation Error:', err);
      if (err?.message?.includes('429') || err?.message?.includes('quota') || err?.message?.includes('limit')) {
        showErrorToastMsg('Model quota exceeded. Please wait a moment before trying again.');
      } else if (err?.message?.includes('503')) {
        showErrorToastMsg('Intelligence server is overloaded. Retrying once...');
      }
      setGenerationError(err.message || 'Failed to generate offer. Please try again.');
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
        [companyId]: { ...p, avatars: updatedAvatars },
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
        [companyId]: { ...prev[companyId], scoreDelta: deltaInsight },
      }));

      loadStageInsights('consolidated', {
        beforeScore: currentOffer.score?.total || 0,
        afterScore: improvedOffer.score?.total || 0,
        biggestGain: deltaInsight.biggestGain,
        weakestLink: deltaInsight.nextWeakLink,
        avatarsCount: compAvatars.length,
        unprocessedCount: 0,
        topAvatarDrilled: true,
      }, comp);

      showSuccessToastMsg('Global offer improved using collective empathy intelligence!');
      setTimeout(() => dismissSuccess(), 4000);
    } catch (err: any) {
      console.error(err);
      alert('Failed to consolidate: ' + (err.message || 'Unknown error'));
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
      if (activeCompanyId) setCurrentView('stage4');
    }
  };

  const handleCompleteAvatars = async (avatars: Avatar[]) => {
    if (!activeCompanyId) return;
    const comp = companies.find(c => c.id === activeCompanyId);
    if (!comp) return;

    updateIndustryIntelligence(comp, avatars, offers[activeCompanyId]);

    setIsGenerating(true);
    try {
      const rankedAvatars = await rankAvatarsForDisplay(avatars, comp);
      setProgress(prev => ({
        ...prev,
        [activeCompanyId]: { ...prev[activeCompanyId], stage3Complete: true, avatars: rankedAvatars },
      }));
    } catch (err) {
      console.error('Failed to rank avatars:', err);
      setProgress(prev => ({
        ...prev,
        [activeCompanyId]: { ...prev[activeCompanyId], stage3Complete: true, avatars },
      }));
    } finally {
      setIsGenerating(false);
    }

    handleStartSynthesis('Modeling', comp, undefined, avatars);
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
          avatars: avatars.filter((a: Avatar) => !idsToDelete.includes(a.id)),
        },
      };
    });
  };

  const handleEditCompanyFromHome = (id: string, phase: 'company' | 'offer' | 'avatar') => {
    const company = companies.find(c => c.id === id);
    if (!company) return;
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
  };

  // Handler for the conflict-modal "create new project from offer" branch.
  const handleDuplicateProjectFromOffer = () => {
    if (!activeCompany) return;
    const newCid = crypto.randomUUID();
    const duplicatedCompany: Company = {
      ...activeCompany,
      id: newCid,
      createdAt: new Date().toISOString(),
    };
    setCompanies([...companies, duplicatedCompany]);
    setActiveCompanyId(newCid);
    setProgress({ ...progress, [newCid]: { stage1Complete: true, stage2Complete: false, stage3Complete: false } });
    closeConflictModal();
    showSuccessToastMsg('Offer duplicated to new project!');
    setTimeout(() => dismissSuccess(), 3500);
    setTimeout(() => {
      handleGenerateOffer(true, newCid);
    }, 100);
  };

  return {
    // company / project workflow
    handleSelectCompany,
    handleStartStage1,
    handleFinishStage1,
    saveCompany,
    handleDeleteCompany,
    handleEditCompanyFromHome,
    // offer
    handleStartStage2,
    handleGenerateOffer,
    handleConsolidateOffer,
    handleDuplicateProjectFromOffer,
    // avatar
    handleUpdateAvatar,
    handleDeleteAvatar,
    handleCompleteAvatars,
    // synthesis + nav
    handleStartSynthesis,
    handleProceedAfterSynthesis,
    handleNavigateToStage,
  };
}