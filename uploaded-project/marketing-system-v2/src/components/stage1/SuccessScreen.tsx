import React from 'react';
import { motion } from 'motion/react';
import { Check, ChevronRight } from 'lucide-react';
import { DotNav } from '../DotNav';

interface SuccessScreenProps {
  companyName: string;
  onAddAnother: () => void;
  onBuildOffer: () => void;
  onStepNav?: (step: number) => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ companyName, onAddAnother, onBuildOffer, onStepNav }) => {
  return (
    <div className="max-w-[800px] mx-auto px-6 pt-16 pb-16 text-center font-sans bg-[var(--color-card-bg)]/50 backdrop-blur-xl rounded-[48px] border border-[var(--color-border-default)] shadow-2xl">
      <DotNav 
        totalSteps={4}
        currentStep={5}
        onStepClick={(s) => onStepNav?.(s)}
        stepName="IDENTITY_ESTABLISHED"
        isStageComplete={true}
      />

      <div className="flex justify-center mb-12">
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: "spring", damping: 15 }}
          className="w-24 h-24 bg-[#0071E3] rounded-[36px] flex items-center justify-center text-white shadow-2xl relative"
        >
          <div className="absolute inset-0 bg-[#0071E3] rounded-[36px] animate-ping opacity-20" />
          <Check size={44} strokeWidth={4} />
        </motion.div>
      </div>

      <h2 className="text-[36px] font-display font-black mb-4 text-[var(--color-text-primary)] tracking-tight">
        {companyName.toUpperCase()}_LINKED
      </h2>
      <p className="text-[17px] text-[var(--color-text-secondary)] mb-12 max-w-[440px] mx-auto font-medium leading-relaxed font-mono opacity-80">
        PROTOCOL_INITIALIZED: Base repository has been established. Intelligence models are ready for strategic synthesis.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        <button 
          onClick={onAddAnother} 
          className="btn-secondary w-full sm:w-auto px-12 py-5 uppercase tracking-[0.3em] text-[10px] font-black border-[var(--color-border-default)] hover:bg-[var(--color-slate-elevated)]"
        >
          Reset_Matrix
        </button>
        <button 
          onClick={onBuildOffer} 
          className="btn-primary w-full sm:w-auto px-12 py-6 group"
        >
          <span className="uppercase tracking-[0.2em] text-[15px]">Proceed to Synthesis</span>
          <ChevronRight size={20} className="ml-3 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
