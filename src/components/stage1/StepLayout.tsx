import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { DotNav } from '../DotNav';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface StepLayoutProps {
  step: number;
  totalSteps: number;
  stepName: string;
  title: string;
  description: string;
  onBack?: () => void;
  onStepNav?: (step: number) => void;
  isStageComplete?: boolean;
  children: React.ReactNode;
  footer?: React.ReactNode;
  logoUrl?: string;
}

export const StepLayout: React.FC<StepLayoutProps> = ({
  step,
  totalSteps,
  stepName,
  title,
  description,
  onBack,
  onStepNav,
  isStageComplete,
  children,
  footer,
  logoUrl
}) => {
  return (
    <div className="max-w-[800px] mx-auto px-6 pt-12 pb-12 font-sans text-[var(--color-text-primary)]">
      <div className="relative h-12 mb-8 flex items-center justify-between">
        <div className="flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="group text-[14px] font-bold text-[var(--color-text-secondary)] hover:text-[#0071E3] transition-all flex items-center gap-2 h-10 px-5 -ml-4 rounded-full hover:bg-white dark:hover:bg-[var(--color-card-bg)] border border-transparent hover:border-[#D2D2D7]/60 dark:hover:border-[var(--color-border-default)]"
            >
              <ArrowLeft size={16} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
              Return
            </button>
          )}
        </div>
        
        {logoUrl && (
          <div className="flex items-center gap-3 px-4 py-2 bg-[var(--color-card-bg)] rounded-full border border-[var(--color-border-default)] shadow-sm animate-in fade-in slide-in-from-top-2 duration-700">
            <div className="w-6 h-6 rounded-md bg-[var(--color-slate-elevated)] flex items-center justify-center overflow-hidden">
                <img src={logoUrl} alt="Brand" className="w-full h-full object-contain p-1" referrerPolicy="no-referrer" />
            </div>
            <span className="text-[9px] font-black text-[var(--color-text-primary)] uppercase tracking-[0.2em] opacity-60">STRATEGIC_ASSET</span>
          </div>
        )}
      </div>

      <DotNav 
        currentStep={step} 
        totalSteps={totalSteps} 
        stepName={stepName} 
        onStepClick={onStepNav || (() => {})} 
        isStageComplete={isStageComplete}
      />

      <div className="space-y-10 mb-12 text-center flex flex-col items-center">
      <div className="space-y-5 text-center flex flex-col items-center">
        <h2 className="text-[32px] sm:text-[42px] font-display font-extrabold tracking-tight text-[var(--color-text-primary)] leading-[1.1]">{title}</h2>
        <p className="text-[17px] sm:text-[19px] text-[var(--color-text-secondary)] leading-relaxed font-medium max-w-[580px] opacity-80">{description}</p>
      </div>

        <div className="w-full">
          {children}
        </div>
      </div>

      {footer && (
        <div className="pt-12 flex justify-center border-t border-[var(--color-border-default)]">
          <div className="w-full max-w-[480px] flex justify-center">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
};
