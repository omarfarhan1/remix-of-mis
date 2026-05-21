import React from 'react';
import { cn } from '../lib/utils';

interface DotNavProps {
  totalSteps: number;
  currentStep: number;
  onStepClick: (step: number) => void;
  stepName: string;
  isStageComplete?: boolean;
}

export const DotNav: React.FC<DotNavProps> = ({ totalSteps, currentStep, onStepClick, stepName, isStageComplete }) => {
  return (
    <div className="flex flex-col items-center gap-4 mb-12 pointer-events-auto">
      <div className="relative flex items-center justify-center gap-6">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const step = i + 1;
          const isCompleted = step < currentStep || isStageComplete;
          const isCurrent = step === currentStep;
          
          return (
            <button
              key={i}
              type="button"
              onClick={() => (isCompleted || isCurrent ? onStepClick(step) : null)}
              className={cn(
                "relative z-10 rounded-full flex items-center justify-center transition-all duration-700 font-black text-[12px]",
                isCurrent 
                  ? "w-10 h-10 bg-[#0071E3] text-white shadow-[0_0_25px_rgba(0,113,227,0.4)] scale-110 border-2 border-white/20" 
                  : isCompleted
                    ? "w-3 h-3 bg-[#0071E3] cursor-pointer hover:scale-150 shadow-[0_0_15px_rgba(0,113,227,0.3)]"
                    : "w-2.5 h-2.5 bg-[#D2D2D7] dark:bg-[var(--color-border-default)] cursor-default"
              )}
              aria-label={`Step ${step}`}
            >
              {isCurrent ? step : null}
              
              {/* Optional: Label below the dot */}
              {isCurrent && (
                <div className="absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.3em] font-mono animate-in fade-in slide-in-from-top-2">
                    {stepName}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
