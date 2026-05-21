import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LockedStageCardProps {
  title: string;
  description: string;
  isNext?: boolean;
  onClick?: () => void;
}

export const LockedStageCard: React.FC<LockedStageCardProps> = ({ title, description, isNext, onClick }) => {
  return (
    <div 
      className={cn(
        "w-full max-w-[640px] mx-auto group transition-all",
        isNext && onClick ? "cursor-pointer" : ""
      )}
      onClick={isNext ? onClick : undefined}
    >
      <div className={cn(
        "relative border rounded-[28px] p-8 transition-all duration-300",
        isNext 
          ? "bg-white border-[#D2D2D7]/60 shadow-sm hover:shadow-xl hover:-translate-y-1" 
          : "bg-[var(--color-disabled-bg)] border-[var(--color-border-default)] opacity-60"
      )}>
        <div className="absolute top-8 right-8">
          {isNext ? (
             <div className="w-8 h-8 rounded-full bg-[#0071E3]/5 flex items-center justify-center text-[#0071E3]">
                <ChevronRight size={18} strokeWidth={2.5} className="group-hover:translate-x-0.5 transition-transform" />
             </div>
          ) : (
            <Lock size={20} className="text-[var(--color-text-placeholder)]" />
          )}
        </div>
        
        {isNext && (
          <div className="absolute top-8 left-8">
             <span className="bg-[#0071E3]/5 text-[#0071E3] text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider">
               Ready to Build
             </span>
          </div>
        )}

        <div className={cn("flex flex-col", isNext ? "mt-12" : "")}>
          <h3 className={cn(
            "text-[21px] font-semibold mb-2 tracking-tight",
            isNext ? "text-[#1D1D1F]" : "text-[var(--color-disabled-text)]"
          )}>{title}</h3>
          <p className="text-[15px] text-[var(--color-text-placeholder)] leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
};
