import React from 'react';
import { StepLayout } from '../stage1/StepLayout';
import { Sparkles, Loader2, Check, MessageSquare, Brain, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sendWizardStep } from '../../services/offerWizardService';
import { Company, Offer } from '../../types';
import { cn } from '../../lib/utils';
import Markdown from 'react-markdown';

interface OfferStepProps {
  step: number;
  totalSteps: number;
  stepName: string;
  title: string;
  description: string;
  example: string;
  placeholder: string;
  value: string;
  fieldKey: keyof Offer;
  company: Partial<Company>;
  draftOffer: Partial<Offer>;
  onChange: (val: string) => void;
  onNext: () => void;
  onBack: () => void;
  onStepNav: (step: number) => void;
  isLast?: boolean;
  isStageComplete?: boolean;
}

export const OfferStep: React.FC<OfferStepProps> = ({
  step,
  totalSteps,
  stepName,
  title,
  description,
  example,
  placeholder,
  value,
  fieldKey,
  company,
  draftOffer,
  onChange,
  onNext,
  onBack,
  onStepNav,
  isLast,
  isStageComplete
}) => {
  const [aiFeedback, setAiFeedback] = React.useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const handleSuggest = async () => {
    if (!value.trim()) {
      setIsSuggesting(true);
      const prompt = `I need help with Step ${step}: ${stepName} (${description}). What are some good directions for ${company.name}?`;
      const result = await sendWizardStep(prompt);
      setAiFeedback(result);
      setIsSuggesting(false);
      return;
    }

    setIsSuggesting(true);
    const result = await sendWizardStep(`My answer for ${stepName} is: "${value}". Please critique and offer better alternatives.`);
    setAiFeedback(result);
    setIsSuggesting(false);
  };

  return (
    <StepLayout
      step={step}
      totalSteps={totalSteps}
      stepName={stepName.toUpperCase()}
      title={title}
      description={description}
      onBack={onBack}
      onStepNav={onStepNav}
      isStageComplete={isStageComplete}
      logoUrl={company.logoUrl}
      footer={
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
          <button
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="flex items-center justify-center gap-3 px-8 h-14 rounded-full bg-[#1D1D1F] text-white font-black uppercase tracking-widest text-[11px] hover:bg-[#0071E3] transition-all disabled:opacity-50 active:scale-95 shadow-xl shadow-black/10"
          >
            {isSuggesting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} className="text-[#0071E3]" />
            )}
            Consultation
          </button>
          
          <button
            disabled={!value.trim()}
            onClick={onNext}
            className={cn(
              "btn-primary ml-auto w-full sm:w-auto h-14 px-10 group", 
              isLast && "bg-[#0071E3] text-white"
            )}
          >
            {isLast ? "Synthesize Market Offer" : "Next Milestone"}
            <ChevronRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      }
    >
        <div className="space-y-10">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-10 rounded-[40px] bg-[#F5F5F7]/80 backdrop-blur-sm border border-[#D2D2D7]/30 shadow-sm relative overflow-hidden group/example text-center"
          >
            <div className="relative flex flex-col items-center">
              <div className="text-[10px] font-black text-[#86868B] mb-4 uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
                Target Benchmark
              </div>
              <p className="text-[20px] italic text-[#1D1D1F] leading-relaxed font-serif max-w-[600px] tracking-tight">
                "{example}"
              </p>
            </div>
          </motion.div>

          <div className="relative group max-w-[700px] mx-auto w-full">
            <span className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.2em] px-1 text-center block opacity-60 mb-3">Strategic Formulation</span>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="input-premium w-full h-48 resize-none text-center text-[22px] p-10 leading-relaxed font-bold tracking-tight custom-scrollbar"
              autoFocus
            />
          </div>

        <AnimatePresence>
          {aiFeedback && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="space-y-6 border-t border-[#D2D2D7]/20 pt-12"
            >
              <div className="flex items-center justify-between px-2">
                <span className="text-[10px] font-black text-[#86868B] uppercase tracking-[0.3em] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1D1D1F] flex items-center justify-center text-white">
                    <Brain size={14} />
                  </div>
                  System Synthesis
                </span>
                <button 
                  onClick={() => setAiFeedback(null)}
                  className="text-[10px] font-black text-[#FF3B30] hover:opacity-70 uppercase tracking-widest transition-opacity"
                >
                  Clear Feed
                </button>
              </div>
              
              <div className="p-10 rounded-[40px] bg-white border border-[#D2D2D7]/40 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#0071E3]/20" />
                <div className="markdown-body text-[16px] text-[#1D1D1F] leading-relaxed font-medium">
                  <Markdown>{aiFeedback}</Markdown>
                </div>
                <div className="mt-8 flex items-center gap-3 text-[10px] font-black text-[#0071E3] uppercase tracking-[0.2em]">
                  <Sparkles size={14} />
                  Algorithmic Optimization Path
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </StepLayout>
  );
};

