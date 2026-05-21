import React from 'react';
import { 
  Check, Copy, RotateCcw, Edit2, ArrowRight, Sparkles, 
  History, UserCircle2, Building2, Target, AlertCircle, 
  TrendingUp, Zap, ThumbsUp, AlertTriangle, Loader2, Brain
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Company, Progress, Offer, OfferScore } from '../../types';
import { DotNav } from '../DotNav';
import { getScoreFixSuggestion } from '../../services/scoreService';
import { cn } from '../../lib/utils';

import { addToEditHistory } from '../../services/historyService';

interface OfferResultProps {
  company: Company;
  offer: Offer;
  onUpdateOffer: (updated: Offer) => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onContinue: () => void;
  progress?: Progress;
  onStepNav?: (step: number) => void;
}

export const OfferResult: React.FC<OfferResultProps> = ({
  company,
  offer,
  onUpdateOffer,
  onRegenerate,
  onEdit,
  onContinue,
  progress,
  onStepNav
}) => {
  const [copied, setCopied] = React.useState(false);
  const [isGettingFix, setIsGettingFix] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(offer.generatedOffer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGetFix = async () => {
    setIsGettingFix(true);
    try {
      const suggestion = await getScoreFixSuggestion(offer);
      onUpdateOffer({
        ...offer,
        fixSuggestion: suggestion
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsGettingFix(false);
    }
  };

  const handleApplyFix = () => {
    if (!offer.fixSuggestion) return;
    
    let newCopy = offer.generatedOffer;
    const { fixSentence, whereToPutIt, weakestDimension } = offer.fixSuggestion;

    if (whereToPutIt.includes('opening')) {
      newCopy = `${fixSentence} ${newCopy}`;
    } else if (whereToPutIt.includes('CTA') || whereToPutIt.includes('end')) {
      newCopy = `${newCopy} ${fixSentence}`;
    } else {
      newCopy = `${newCopy}\n\n${fixSentence}`;
    }

    const delta = 12;
    addToEditHistory({
      field: 'generatedOffer',
      before: offer.generatedOffer,
      after: newCopy,
      industry: company.industry,
      timestamp: new Date().toISOString(),
      type: 'score_improvement',
      deltaScore: delta
    });

    const currentScore = offer.score?.total || 0;
    onUpdateOffer({
      ...offer,
      generatedOffer: newCopy,
      fixSuggestion: undefined,
      score: {
        ...(offer.score || { total: 0, clarity: 0, relevance: 0, urgency: 0, reasoning: '' }),
        total: Math.min(currentScore + delta, 98),
        [weakestDimension]: 85
      }
    });
  };

  const score = offer.score || { total: 0, clarity: 0, relevance: 0, urgency: 0, reasoning: '' };
  const strategySynthesis = progress?.synthesisReports?.['Strategy'];

  return (
    <div className="max-w-[900px] mx-auto px-6 pt-24 pb-32 animate-fade-in font-sans">
      {strategySynthesis && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 p-8 bg-[var(--color-slate-elevated)] border border-[var(--color-border-default)] rounded-[40px] flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                <Brain size={28} />
             </div>
             <div>
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em] mb-1">Stratos Analysis Verdict</h4>
                <p className="text-[18px] text-[var(--color-text-primary)] font-bold italic leading-relaxed">
                  “{strategySynthesis.verdict}”
                </p>
             </div>
          </div>
          <div className="flex flex-wrap gap-2">
             {strategySynthesis.recommendations.slice(0, 2).map((rec, i) => (
                <div key={i} className="px-4 py-2 bg-white dark:bg-[#1D1D1F] border border-[var(--color-border-default)] rounded-xl text-[12px] text-[var(--color-text-secondary)] font-medium">
                   {rec}
                </div>
             ))}
          </div>
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-10 mb-24">
        <div className="flex items-start gap-8">
          {company.logoUrl ? (
            <div className="w-24 h-24 rounded-[32px] bg-white border border-[#D2D2D7]/30 flex items-center justify-center shadow-sm p-4 overflow-hidden shrink-0 mt-1">
              <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-[32px] bg-[#F5F5F7] text-[#1D1D1F] flex items-center justify-center shrink-0 border border-[#D2D2D7]/30 mt-1">
              <Building2 size={40} strokeWidth={1.5} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#1D1D1F] text-white text-[9px] font-black uppercase tracking-[0.25em] rounded-full">Phase 02 / Strategic Logic</span>
              <span className="text-[#D2D2D7] text-xs opacity-50 font-black tracking-widest">/</span>
              <span className="text-[14px] font-black text-[#86868B] uppercase tracking-widest opacity-80">{company.name}</span>
            </div>
            <h1 className="text-[56px] font-display font-bold tracking-tight leading-[0.9] text-[#1D1D1F]">Market Offer.</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
            <button
                onClick={onRegenerate}
                className="btn-secondary h-12 px-6 flex items-center gap-3"
            >
                <RotateCcw size={16} strokeWidth={3} className="text-[#86868B]" />
                <span className="uppercase tracking-widest text-[11px] font-black">Reconstruct</span>
            </button>
            <button
                onClick={onEdit}
                className="btn-primary h-12 px-8 uppercase tracking-widest flex items-center gap-3"
            >
                <Edit2 size={16} strokeWidth={3} />
                Refine
            </button>
        </div>
      </header>

      <div className="mb-20">
        <DotNav 
            totalSteps={5}
            currentStep={6}
            onStepClick={(s) => onStepNav?.(s)}
            stepName="STRATEGY VERIFIED"
            isStageComplete={true}
        />
      </div>

      <div className="space-y-16">
        <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative group"
        >
          <div className="absolute -inset-10 bg-[#F5F5F7]/40 dark:bg-white/5 rounded-[60px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="relative bg-white dark:bg-[#222222] border border-[#D2D2D7]/40 dark:border-white/10 rounded-[50px] p-16 transition-all duration-700 hover:shadow-[0_80px_150px_-30px_rgba(0,0,0,0.12)] dark:hover:shadow-black/40 border-b-[8px] border-b-[var(--color-slate-elevated)] dark:border-b-white/5">
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-[#1D1D1F] dark:bg-white/10 flex items-center justify-center text-white shadow-lg shadow-black/10">
                    <Sparkles size={20} strokeWidth={2.5} />
                  </div>
                  <span className="text-[11px] font-black text-[#1D1D1F] dark:text-white/60 uppercase tracking-[0.3em]">Synthesized Copy</span>
              </div>
              <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-5 py-2.5 bg-white dark:bg-white/5 rounded-full border border-[#D2D2D7] dark:border-white/10 shadow-sm">
                <TrendingUp size={16} className="text-emerald-600 dark:text-emerald-500" strokeWidth={3} />
                <span className="text-[12px] font-black text-[#1D1D1F] dark:text-white/80 uppercase tracking-widest">Efficiency: {score.total}%</span>
              </div>
              </div>
            </div>

            <p className="text-[36px] font-bold leading-[1.3] tracking-tight text-[#1D1D1F] dark:text-white mb-16 font-serif italic text-pretty">
              “{offer.generatedOffer}”
            </p>

            <div className="flex items-center justify-between pt-12 border-t border-[#F5F5F7] dark:border-white/5">
               <div className="flex items-center gap-8">
                 <button 
                   onClick={handleCopy}
                   className="flex items-center gap-3 text-[#1D1D1F] dark:text-white transition-all group/copy"
                 >
                   {copied ? (
                     <>
                       <div className="w-12 h-12 rounded-[18px] bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                         <Check size={20} strokeWidth={3} />
                       </div>
                       <span className="text-[14px] font-black uppercase tracking-widest text-emerald-500">Copied</span>
                     </>
                   ) : (
                     <>
                        <div className="w-12 h-12 rounded-[18px] bg-[#F5F5F7] dark:bg-white/10 flex items-center justify-center group-hover/copy:bg-[#1D1D1F] dark:group-hover/copy:bg-white group-hover/copy:text-white dark:group-hover/copy:text-[#1D1D1F] transition-all">
                            <Copy size={20} strokeWidth={2.5} />
                        </div>
                       <span className="text-[14px] font-black uppercase tracking-widest text-[#1D1D1F] dark:text-white opacity-80 group-hover/copy:opacity-100">Copy Strategy</span>
                     </>
                   )}
                 </button>
               </div>
               
               <div className="flex items-center gap-6">
                  {score.total < 85 && !offer.fixSuggestion && (
                    <button 
                      onClick={handleGetFix}
                      disabled={isGettingFix}
                      className="flex items-center justify-center gap-3 px-8 h-12 bg-amber-500/10 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-amber-500/20 transition-all disabled:opacity-50"
                    >
                      {isGettingFix ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Zap size={16} strokeWidth={3} />
                      )}
                      Score Logic
                    </button>
                  )}
               </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {offer.fixSuggestion && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="overflow-hidden"
            >
              <div className="p-16 bg-[#FF9500]/5 border-2 border-[#FF9500]/20 rounded-[50px] shadow-xl shadow-[#FF9500]/5 relative">
                <div className="absolute top-0 left-0 w-2 h-full bg-[#FF9500]" />
                
                <div className="flex flex-col lg:flex-row gap-16">
                   <div className="flex-1 space-y-10">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#FF9500] flex items-center justify-center text-white">
                          <AlertTriangle size={20} strokeWidth={3} />
                        </div>
                        <h4 className="text-[11px] font-black text-[#FF9500] uppercase tracking-[0.4em]">
                          {offer.fixSuggestion.weakestDimension} Optimization Required
                        </h4>
                      </div>
                      
                      <p className="text-[24px] font-bold text-[#1D1D1F] leading-[1.3] tracking-tight">
                        {offer.fixSuggestion.diagnosis}
                      </p>

                      <div className="space-y-4">
                        <span className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.3em] block opacity-60">Proposed Strategic Pivot</span>
                        <div className="p-8 bg-white/60 backdrop-blur-md rounded-3xl border border-[#FF9500]/30 italic text-[18px] text-[#1D1D1F] font-bold leading-relaxed shadow-sm">
                          "{offer.fixSuggestion.fixSentence}"
                        </div>
                      </div>
                   </div>

                   <div className="shrink-0 flex flex-col justify-end gap-4 min-w-[240px]">
                      <button
                        onClick={handleApplyFix}
                        className="w-full h-16 bg-[#FF9500] text-white rounded-3xl font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-[#E68600] transition-all shadow-2xl shadow-[#FF9500]/30 active:scale-95"
                      >
                        <ThumbsUp size={20} strokeWidth={3} />
                        Apply Path
                      </button>
                      <button
                        onClick={() => onUpdateOffer({ ...offer, fixSuggestion: undefined })}
                        className="w-full py-4 text-[10px] font-black text-[#86868B] uppercase tracking-[0.3em] hover:text-[#FF3B30] transition-colors"
                      >
                        Ignore Suggestion
                      </button>
                   </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Clarity', val: score.clarity, color: '#0071E3' },
            { label: 'Relevance', val: score.relevance, color: '#34C759' },
            { label: 'Urgency', val: score.urgency, color: '#FF3B30' }
          ].map((stat) => (
            <div key={stat.label} className="p-10 rounded-[40px] bg-white border border-[#D2D2D7] dark:border-[var(--color-border-default)] shadow-sm transition-all hover:shadow-md hover:-translate-y-1 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-[#6E6E73] dark:text-[#86868B] uppercase tracking-[0.3em] opacity-100">{stat.label}</span>
                <span className="text-[18px] font-black text-[#1D1D1F] dark:text-white">{stat.val}%</span>
              </div>
              <div className="h-2 bg-[#F5F5F7] rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${stat.val}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full" 
                  style={{ backgroundColor: stat.color }} 
                />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-10 rounded-[40px] bg-white dark:bg-[#222222] border border-[#D2D2D7]/40 dark:border-white/10 shadow-sm transition-all hover:border-emerald-500/30">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-[#F5F5F7] dark:bg-white/10 flex items-center justify-center text-[#1D1D1F] dark:text-white">
                    <Target size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-[#1D1D1F] dark:text-white/60 uppercase tracking-[0.3em]">Market Resonance</span>
            </div>
            <div className="text-[20px] font-bold text-[#1D1D1F] dark:text-white/90 leading-tight tracking-tight">
                Calibrated for {company.industry} sectors emphasizing <span className="text-emerald-500">{company.usp}</span>.
            </div>
          </div>

          <div className="p-10 rounded-[40px] bg-[#1D1D1F] dark:bg-[#2C2C2E] border border-transparent shadow-2xl shadow-black/20 transition-all hover:bg-black group/evo">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white/60">
                    <History size={20} strokeWidth={2.5} />
                </div>
                <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.3em]">Strategic Evolution</span>
            </div>
            <div className="text-[20px] font-bold text-white leading-tight tracking-tight">
                Leveraging the latest <span className="text-emerald-400">synthetic empathy modeling</span> for engagement depth.
            </div>
          </div>
        </div>

        <div className="mt-24 flex justify-center">
          <button
            onClick={onContinue}
            className="group relative px-16 py-8 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] rounded-[32px] font-black uppercase tracking-[0.2em] text-[15px] shadow-2xl shadow-black/20 dark:shadow-white/5 hover:scale-105 active:scale-95 transition-all flex items-center gap-6"
          >
            <span>Initialize Avatar Phase</span>
            <ArrowRight size={22} strokeWidth={3} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
