import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Brain, Check, ShieldCheck, ArrowRight, UserCircle2, Info, ChevronRight, MessageCircle, BarChart3, Target, Zap, Heart, Star, Filter, ArrowLeft, History, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { DotNav } from '../DotNav';
import { Company, Offer, Avatar, SynthesisReport } from '../../types';
import { generateInitialAvatars, deepDiveAvatar, generateSubAvatars, initAvatarSession, endAvatarSession } from '../../services/avatarService';
import { rankAvatarsForDisplay } from '../../services/intelligenceService';
import { validateInputQuality } from '../../services/validationService';
import { cn } from '../../lib/utils';
import { AvatarDeepDiveCard } from './AvatarDeepDiveCard';
import { StorageManager, STORAGE_KEYS } from '../../lib/storage';
import { IndustryIntelligence, ActionableInsight } from '../../types';
import { ActionableInsightsCard } from '../intel/ActionableInsightsCard';

interface AvatarWizardProps {
  company: Company;
  offer: Offer;
  strategicReport?: SynthesisReport;
  onComplete: (avatars: Avatar[]) => void;
  onBack: () => void;
  onUpdateCompany?: (updated: Company) => void;
  onAvatarsGenerated?: (avatars: Avatar[]) => void;
  onDeepDiveComplete?: (avatar: Avatar) => void;
  insights?: ActionableInsight[];
  isInsightsLoading?: boolean;
}

export const AIGeneratedAvatarWizard: React.FC<AvatarWizardProps> = ({ 
  company, 
  offer, 
  strategicReport,
  onComplete, 
  onBack, 
  onUpdateCompany,
  onAvatarsGenerated,
  onDeepDiveComplete,
  insights,
  isInsightsLoading
}) => {
  const [step, setStep] = React.useState<'finding' | 'selection' | 'deep-diving' | 'results' | 'blocked'>('finding');
  const [isForced, setIsForced] = React.useState(false);
  const [availableAvatars, setAvailableAvatars] = React.useState<Avatar[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [deepDivedAvatars, setDeepDivedAvatars] = React.useState<Avatar[]>([]);
  const [loadingMessage, setLoadingMessage] = React.useState('Scanning your brand strategy...');
  const [subLoadingId, setSubLoadingId] = React.useState<string | null>(null);
  const [drillHistory, setDrillHistory] = React.useState<Avatar[][]>([]);

  const [showLowPriority, setShowLowPriority] = React.useState(false);

  // Stepper logic
  const steps = [
    { id: 'selection', label: 'Archetypes' },
    { id: 'results', label: 'Empathy' }
  ];
  const currentStepIndex = steps.findIndex(s => s.id === (step === 'results' ? 'results' : 'selection'));
  const hasFinishedDeepDive = deepDivedAvatars.length > 0;

  const { prioritizedAvatars, lowPriorityAvatars } = React.useMemo(() => {
    const p: Avatar[] = [];
    const l: Avatar[] = [];
    (availableAvatars || []).forEach(a => {
      const priority = a.uiMetadata?.priorityLabel || 'secondary';
      if (priority === 'low-priority') l.push(a);
      else p.push(a);
    });
    return { prioritizedAvatars: p, lowPriorityAvatars: l };
  }, [availableAvatars]);

  const [industryIntel, setIndustryIntel] = React.useState<any>(null);

  React.useEffect(() => {
    StorageManager.load<Record<string, unknown>>(STORAGE_KEYS.INDUSTRY_INTELLIGENCE, {}).then((allIntel) => {
      setIndustryIntel(allIntel[company.industry] ?? null);
    });
  }, [company.industry]);

  // Initial generation with validation
  React.useEffect(() => {
    const init = async () => {
      try {
        if (!isForced) {
          setLoadingMessage('Validating input quality...');
          const qualityResult = await validateInputQuality(company, offer);

          if (!qualityResult.isReadyToGenerate) {
            if (onUpdateCompany) {
              onUpdateCompany({
                ...company,
                validationResult: {
                  question: qualityResult.clarifyingQuestion,
                  example: qualityResult.exampleOfGoodVersion,
                  score: qualityResult.qualityScore
                }
              });
            }
            setStep('blocked');
            return;
          }
        }

        setLoadingMessage('Identifying core avatars...');
        const initialAvatars = await generateInitialAvatars(company, offer, strategicReport);
        
        setLoadingMessage('Ranking by business potential...');
        const ranked = await rankAvatarsForDisplay(initialAvatars, company);
        setAvailableAvatars(ranked);
        onAvatarsGenerated?.(ranked);
        setStep('selection');
        setIsForced(false); // Reset
      } catch (err) {
        console.error(err);
      }
    };
    if (step === 'finding') init();
  }, [step, company, offer, onUpdateCompany, isForced]);

  const handleDrillDown = async (parent: Avatar) => {
    setSubLoadingId(parent.id);
    setLoadingMessage(`Niche-drilling into ${parent.name}...`);
    try {
      const subs = await generateSubAvatars(parent, company, offer);
      setDrillHistory(prev => [...prev, availableAvatars]);
      setAvailableAvatars(subs);
      setSelectedIds([]); // Reset selection for new level
    } catch (err) {
      console.error(err);
    } finally {
      setSubLoadingId(null);
    }
  };

  const handleLevelBack = () => {
    if (drillHistory.length > 0) {
      const prev = drillHistory[drillHistory.length - 1];
      setAvailableAvatars(prev);
      setDrillHistory(drillHistory.slice(0, -1));
      setSelectedIds([]);
    } else {
      onBack();
    }
  };

  const handleStartDeepDive = async () => {
    setStep('deep-diving');
    setLoadingMessage('Optimizing AI session for scale...');
    try {
      await initAvatarSession(company, offer);
      const selectedAvatars = availableAvatars.filter(a => selectedIds.includes(a.id));
      setDeepDivedAvatars(selectedAvatars);
      setStep('results');
    } catch (err) {
      console.error("Failed to start deep dive session:", err);
      // Still proceed, cache is optional optimization
      const selectedAvatars = availableAvatars.filter(a => selectedIds.includes(a.id));
      setDeepDivedAvatars(selectedAvatars);
      setStep('results');
    }
  };

  React.useEffect(() => {
    return () => {
      endAvatarSession();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FBFBFD] pb-32 sm:pb-40">
      {/* Strategic Stepper for jumping between selection and results */}
      {(step === 'selection' || step === 'results') && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[40] w-full max-w-[320px] px-6">
          <div className="bg-white/80 backdrop-blur-xl border border-[#D2D2D7]/30 rounded-full h-12 flex items-center justify-between px-6 shadow-xl shadow-black/5">
            {steps.map((s, idx) => (
              <React.Fragment key={s.id}>
                {idx > 0 && <div className="w-8 h-[1px] bg-[#D2D2D7]/50" />}
                <button
                  onClick={() => {
                    if (idx <= currentStepIndex || (s.id === 'results' && hasFinishedDeepDive)) {
                      setStep(s.id as any);
                    }
                  }}
                  disabled={idx > currentStepIndex && !hasFinishedDeepDive}
                  className={cn(
                    "text-[9px] font-black uppercase tracking-[0.2em] transition-all",
                    step === s.id ? "text-[#0071E3]" : (idx < currentStepIndex || hasFinishedDeepDive) ? "text-[#1D1D1F] hover:text-[#0071E3]" : "text-[#D2D2D7]"
                  )}
                >
                  {s.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 'finding' && (
          <motion.div 
            key="finding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[440px] mx-auto pt-48 px-6 text-center"
          >
             <div className="relative mb-12">
                <div className="absolute inset-0 bg-[#0071E3]/20 blur-[100px] rounded-full scale-150" />
                <motion.div
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="relative w-24 h-24 bg-white/80 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[32px] border border-white flex items-center justify-center mx-auto"
                >
                   <Sparkles className="text-[#0071E3]" size={40} strokeWidth={2.5} />
                </motion.div>
             </div>
             <h2 className="text-[28px] sm:text-[32px] font-display font-bold mb-4 tracking-tight leading-tight">Analyzing Market.</h2>
             <p className="text-[14px] text-[#86868B] font-medium animate-pulse tracking-wide font-mono uppercase text-[10px] sm:text-[11px] font-black opacity-60">{loadingMessage}</p>
          </motion.div>
        )}

        {step === 'blocked' && company.validationResult && (
          <motion.div
            key="blocked"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="max-w-[800px] mx-auto px-6 pt-24"
          >
            <div className="bg-white rounded-[40px] sm:rounded-[50px] p-8 sm:p-16 border border-[#D2D2D7]/40 shadow-2xl relative overflow-hidden text-left">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FF9500]/5 blur-[120px] -mr-[250px] -mt-[250px] rounded-full" />
              
              <div className="relative z-10 space-y-8 sm:space-y-12">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[24px] sm:rounded-[30px] bg-[#FF9500]/10 flex items-center justify-center text-[#FF9500] shadow-sm border border-[#FF9500]/20">
                    <AlertCircle size={40} strokeWidth={2.5} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-[32px] sm:text-[40px] font-display font-bold tracking-tight text-[#1D1D1F] leading-tight">
                      Input Quality.
                    </h2>
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#86868B] font-black uppercase tracking-[0.3em]">Score:</span>
                        <div className="px-3 py-1 bg-[#FF9500] text-white text-[11px] font-black rounded-full">{company.validationResult.score}%</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-10 bg-[#F5F5F7] rounded-[32px] sm:rounded-[40px] space-y-6 border border-[#D2D2D7]/30 shadow-inner">
                  <p className="text-[18px] sm:text-[22px] font-bold text-[#1D1D1F] leading-relaxed italic pr-4">
                    "{company.validationResult.question}"
                  </p>
                </div>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-4 pt-12 sm:pt-16 border-t border-[#D2D2D7]/20 mt-12">
                   <button
                    onClick={onBack}
                    className="flex-1 py-5 bg-[#1D1D1F] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[13px] flex items-center justify-center gap-4 hover:shadow-xl transition-all"
                  >
                    Edit Profile
                  </button>
                  <button
                    onClick={() => {
                      setIsForced(true);
                      setStep('finding');
                    }}
                    className="px-8 py-5 bg-white border border-[#D2D2D7]/40 text-[#86868B] rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-4"
                  >
                    Force
                  </button>
              </div>
            </div>
          </motion.div>
        )}


        {step === 'selection' && (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[1200px] mx-auto px-6 pt-32 sm:pt-40 pb-40"
          >
            <div className="mb-12 sm:mb-24 flex flex-col items-start gap-8 sm:gap-12 text-left">
               <div className="flex-1 w-full">
                  <button 
                    onClick={handleLevelBack}
                    className="flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] text-[#0071E3] mb-6 hover:opacity-70 transition-opacity"
                  >
                     <ArrowLeft size={16} strokeWidth={3} />
                     {drillHistory.length > 0 ? "Strategic Level Back" : "Change Vector"}
                  </button>
                  
                  {industryIntel && industryIntel.companiesAnalyzed >= 1 && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#34C759]/10 text-[#34C759] rounded-full border border-[#34C759]/20 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] mb-4 sm:mb-6"
                    >
                       <Brain size={14} strokeWidth={2.5} />
                       Historical Delta: {industryIntel.companiesAnalyzed} Analyzed
                    </motion.div>
                  )}
                  
                  <h2 className="text-[36px] sm:text-[56px] font-display font-bold tracking-tight leading-[1] text-[#1D1D1F] mb-6">Market Archetypes.</h2>
                  <p className="text-[17px] sm:text-[20px] text-[#86868B] max-w-[600px] font-medium leading-relaxed">
                    {drillHistory.length > 0 
                      ? "Refining high-fidelity niches within the selected strategic segment." 
                      : "We've synthesized unique customer archetypes. Select the archetypes you intend to dominate."}
                  </p>
               </div>
               
               {drillHistory.length > 0 && (
                 <div className="flex items-center gap-4 bg-[#1D1D1F] px-5 py-2.5 rounded-full text-white shadow-xl shadow-black/10">
                    <History size={16} className="text-white/40" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Depth / {drillHistory.length + 1}</span>
                 </div>
               )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-40">
              {prioritizedAvatars.map((avatar, i) => (
                <motion.div
                  key={avatar.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                      delay: i * 0.05,
                      duration: 0.8,
                      ease: [0.32, 0.72, 0, 1]
                  }}
                  onClick={() => {
                    if (selectedIds.includes(avatar.id)) {
                      setSelectedIds(prev => prev.filter(id => id !== avatar.id));
                    } else {
                      setSelectedIds(prev => [...prev, avatar.id]);
                    }
                  }}
                  className={cn(
                    "relative group text-left p-8 sm:p-12 rounded-[40px] sm:rounded-[50px] border-2 transition-all duration-700 bg-white cursor-pointer flex flex-col",
                    selectedIds.includes(avatar.id) 
                      ? "border-[#0071E3] shadow-[0_40px_80px_-20px_rgba(0,113,227,0.15)] bg-[#0071E3]/[0.01]" 
                      : "border-[#D2D2D7]/30 hover:border-[#D2D2D7]/80 hover:shadow-xl"
                  )}
                >
                  <div className="flex items-start justify-between mb-6 sm:mb-8">
                    <div className={cn(
                      "w-12 h-12 sm:w-16 sm:h-16 rounded-[18px] sm:rounded-[22px] flex items-center justify-center transition-all duration-500",
                      selectedIds.includes(avatar.id) ? "bg-[#0071E3] text-white shadow-lg shadow-[#0071E3]/40 scale-110" : "bg-[#F5F5F7] text-[#1D1D1F]"
                    )}>
                      {selectedIds.includes(avatar.id) ? <Check size={32} strokeWidth={3} /> : <UserCircle2 size={32} strokeWidth={1.5} />}
                    </div>
                    {avatar.score && (
                      <div className="flex flex-col items-end">
                        <div className="text-[8px] sm:text-[9px] uppercase font-black text-[#86868B] tracking-[0.3em] mb-1 sm:mb-2 text-right">Buy Propensity</div>
                        <div className="flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-[#F5F5F7] rounded-full border border-[#D2D2D7]/20">
                           <Star size={12} className="fill-[#0071E3] text-[#0071E3]" />
                           <span className="text-[12px] sm:text-[14px] font-black tracking-tight">{avatar.score} / 10</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2 mb-6 sm:mb-8">
                     <h3 className="text-[20px] sm:text-[24px] font-bold tracking-tight text-[#1D1D1F] leading-tight group-hover:text-[#0071E3] transition-colors">{avatar.name}</h3>
                     <div className="flex flex-wrap gap-2">
                         <span className={cn(
                            "text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-[0.2em] border text-left",
                            avatar.uiMetadata?.priorityLabel === 'primary' ? "bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20" : "bg-[#0071E3]/5 text-[#0071E3] border-[#0071E3]/20"
                         )}>
                            {avatar.uiMetadata?.priorityLabel === 'primary' ? 'High Fidelity' : avatar.category}
                         </span>
                     </div>
                  </div>

                  <div className="mb-6 space-y-2 text-left">
                     <div className="text-[9px] font-black text-[#86868B] uppercase tracking-[0.3em] opacity-60">Strategic Differentiator</div>
                     <div className="text-[14px] sm:text-[15px] font-bold text-[#1D1D1F] leading-snug tracking-tight line-clamp-2">{avatar.definingCharacteristic}</div>
                  </div>

                  <p className="text-[14px] sm:text-[15px] text-[#86868B] leading-relaxed mb-6 sm:mb-8 line-clamp-3 font-medium text-left">
                    {avatar.description}
                  </p>

                  <div className="mt-auto pt-6 sm:pt-8 border-t border-[#F5F5F7] text-left">
                     <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col flex-1 min-w-0">
                           <span className="text-[9px] font-black text-[#86868B] uppercase tracking-[0.3em] mb-2 opacity-60">Logic reasoning</span>
                           <p className="text-[12px] italic text-[#86868B] leading-relaxed font-medium truncate">"{avatar.reasoning}"</p>
                        </div>
                        
                        {avatar.canHaveSubAvatars && (
                          <button
                            onClick={(e) => {
                               e.stopPropagation();
                               handleDrillDown(avatar);
                            }}
                            disabled={subLoadingId === avatar.id}
                            className={cn(
                                "w-12 h-12 sm:w-14 sm:h-14 rounded-[15px] sm:rounded-[18px] flex items-center justify-center transition-all duration-500 shadow-sm border",
                                subLoadingId === avatar.id ? "bg-white border-[#D2D2D7]/20" : "bg-[#F5F5F7] group-hover:bg-[#1D1D1F] group-hover:text-white border-transparent"
                            )}
                          >
                             {subLoadingId === avatar.id ? <Loader2 size={18} className="animate-spin" /> : <Filter size={20} strokeWidth={2.5} />}
                          </button>
                        )}
                     </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {lowPriorityAvatars.length > 0 && (
               <div className="mb-40">
                  <div className="flex justify-center mb-10">
                      <button 
                        onClick={() => setShowLowPriority(!showLowPriority)}
                        className="flex items-center gap-4 px-10 py-5 bg-white hover:bg-[#F5F5F7] border border-[#D2D2D7]/40 rounded-full transition-all group/toggle"
                      >
                         <div className={cn("w-6 h-6 rounded-lg bg-[#D2D2D7]/20 flex items-center justify-center transition-transform duration-500", showLowPriority && "rotate-90 bg-[#1D1D1F] text-white")}>
                            <ChevronRight size={14} strokeWidth={3} />
                         </div>
                         <span className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.3em]">
                            {showLowPriority ? "Hide" : "Show"} {lowPriorityAvatars.length} Latent Market Segments
                         </span>
                      </button>
                  </div>

                  <AnimatePresence>
                     {showLowPriority && (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 overflow-hidden"
                        >
                           {lowPriorityAvatars.map((avatar) => (
                              <div 
                                key={avatar.id}
                                className="p-10 bg-white border border-[#D2D2D7]/30 rounded-[40px] transition-all opacity-60 hover:opacity-100 grayscale hover:grayscale-0 hover:shadow-xl group/latent text-left"
                              >
                                 <div className="flex items-center justify-between mb-6">
                                    <div className="text-[18px] font-bold text-[#1D1D1F] tracking-tight group-hover/latent:text-[#0071E3] transition-colors">{avatar.name}</div>
                                    <div className="px-3 py-1 bg-[#F5F5F7] rounded-full text-[11px] font-black text-[#86868B]">
                                       {avatar.score}/10
                                    </div>
                                 </div>
                                 <p className="text-[14px] text-[#86868B] mb-8 font-medium leading-relaxed line-clamp-2">{avatar.description}</p>
                                 <div className="text-[10px] font-black text-[#FF3B30] uppercase tracking-[0.2em] flex items-center gap-3 py-3 border-t border-[#F5F5F7]">
                                    <Filter size={14} strokeWidth={2.5} />
                                    {avatar.uiMetadata?.collapseReason || 'Lower confidence score'}
                                 </div>
                              </div>
                           ))}
                        </motion.div>
                     )}
                  </AnimatePresence>
               </div>
            )}

            <div className="fixed bottom-10 left-0 right-0 flex justify-center px-6 z-50">
               <button
                 disabled={selectedIds.length === 0}
                 onClick={handleStartDeepDive}
                 className="group w-full max-w-[480px] h-14 sm:h-16 bg-[#1D1D1F] text-white rounded-full font-black uppercase tracking-[0.2em] text-[12px] sm:text-[14px] shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-center gap-4 sm:gap-6 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
               >
                 <span>Analyze Selected ({selectedIds.length})</span>
                 <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
               </button>
            </div>
          </motion.div>
        )}

        {step === 'deep-diving' && (
          <motion.div 
            key="deep-diving"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="max-w-[440px] mx-auto pt-48 px-6 text-center"
          >
             <div className="relative mb-12">
                <div className="absolute inset-x-0 top-0 bottom-0 bg-[#0071E3]/20 blur-[100px] rounded-full" />
                <motion.div
                  animate={{ 
                    rotate: 360,
                  }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 border-[6px] border-[#0071E3]/10 border-t-[#0071E3] rounded-[48px] mx-auto flex items-center justify-center relative bg-white/50 backdrop-blur-md"
                >
                   <Brain size={48} className="text-[#0071E3]" strokeWidth={2.5} />
                </motion.div>
             </div>
             <h2 className="text-[32px] font-display font-bold mb-4 tracking-tight leading-tight">Synthesizing Empathy.</h2>
             <p className="text-[15px] text-[#86868B] mb-8 font-medium leading-relaxed">
               Mapping neural pathways and behavioral triggers. This involves a 3-stage intelligence layer and may take up to 2 minutes per model.
             </p>
             <div className="flex flex-col gap-2">
                <div className="px-6 py-2 bg-[#0071E3] text-white rounded-full inline-block text-[11px] font-black uppercase tracking-[0.3em] shadow-xl shadow-[#0071E3]/20">
                  {loadingMessage}
                </div>
                <p className="text-[10px] text-[#86868B] font-black uppercase tracking-[0.2em] opacity-40 mt-4 animate-pulse">
                  Calibrating market resonance...
                </p>
             </div>
          </motion.div>
        )}

        {step === 'results' && (
           <motion.div 
             key="results"
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             className="max-w-[1400px] mx-auto px-6 pt-24 pb-48"
           >
              <div className="text-center mb-32 space-y-8">
                 <div className="flex justify-center mb-10">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#34C759]/10 text-[#34C759] px-6 py-3 rounded-full font-black text-[11px] uppercase tracking-[0.3em] flex items-center gap-4 border border-[#34C759]/20 shadow-xl shadow-[#34C759]/5"
                    >
                       <div className="w-5 h-5 rounded-md bg-[#34C759] flex items-center justify-center text-white">
                           <Check size={14} strokeWidth={3} />
                       </div>
                       Empathy Extraction Stabilized
                    </motion.div>
                 </div>
                 <h2 className="text-[72px] font-display font-bold tracking-tight leading-[0.85] text-[#1D1D1F]">Empathy Models.</h2>
                 <p className="text-[20px] text-[#86868B] max-w-[700px] mx-auto font-medium leading-relaxed">
                   We've decrypted their psychological core, daily environmental triggers, and internal transformation paths.
                 </p>
              </div>

              <div className="space-y-48">
                {deepDivedAvatars.map((avatar, idx) => (
                  <AvatarDeepDiveCard 
                    key={avatar.id} 
                    avatar={avatar} 
                    company={company}
                    offer={offer}
                    index={idx} 
                    onUpdateAvatar={(updated) => {
                      setDeepDivedAvatars(prev => prev.map(a => a.id === updated.id ? updated : a));
                    }}
                    onDeepDiveComplete={(av) => onDeepDiveComplete?.(av)}
                  />
                ))}
              </div>

              {/* Insights with premium spacing */}
              <div className="pt-48 pb-32">
                 <div className="text-center mb-20 space-y-4">
                    <div className="text-[11px] font-black text-[#0071E3] uppercase tracking-[0.4em] opacity-80">Strategic Intelligence</div>
                    <h2 className="text-[48px] font-display font-bold tracking-tight text-[#1D1D1F]">Vertical Insights.</h2>
                 </div>
                 <ActionableInsightsCard insights={insights || []} isLoading={isInsightsLoading || false} />
              </div>

              <div className="fixed bottom-12 left-0 right-0 flex justify-center px-6 z-50">
                 <button
                   onClick={() => onComplete(deepDivedAvatars)}
                   className="group w-full max-w-[480px] h-20 bg-[#0071E3] text-white rounded-full font-black uppercase tracking-[0.2em] text-[15px] shadow-[0_30px_60px_rgba(0,113,227,0.3)] flex items-center justify-center gap-6 hover:scale-[1.02] active:scale-95 transition-all"
                 >
                   <span>Save All Profiles</span>
                   <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
                 </button>
              </div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

