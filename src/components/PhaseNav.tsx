import React from 'react';
import { motion } from 'motion/react';
import { Building2, Sparkles, UserCircle2, BarChart3, Megaphone, Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { Progress } from '../types';

interface PhaseNavProps {
  currentView: 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5';
  currentStep?: number;
  progress?: Progress;
  onNavigate: (view: any, step?: number) => void;
}

export const PhaseNav: React.FC<PhaseNavProps> = ({ currentView, currentStep, progress, onNavigate }) => {
  const stages = [
    { id: 'stage1', label: 'Company', icon: Building2, required: true },
    { id: 'stage2', label: 'Build Offer', icon: Sparkles, required: true },
    { id: 'stage3', label: 'Archetypes', icon: UserCircle2, required: false },
    { id: 'stage4', label: 'Audience', icon: BarChart3, required: false },
    { id: 'stage5', label: 'Ad Copy', icon: Megaphone, required: false },
  ];

  const isUnlocked = (stageId: string, index: number) => {
    if (index === 0) return true; // Stage 1 is always unlocked
    if (!progress) return false;
    
    if (stageId === 'stage2') return progress.stage1Complete;
    if (stageId === 'stage3') return progress.stage2Complete;
    if (stageId === 'stage4') return progress.stage3Complete;
    return false;
  };

  return (
    <div className="w-full bg-[var(--color-card-bg)]/80 backdrop-blur-2xl border-b border-[var(--color-border-default)] sticky top-[80px] z-[40]">
      <div className="max-w-[720px] mx-auto flex items-center justify-between px-4">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const unlocked = isUnlocked(stage.id, index);
          const active = currentView === stage.id;
          
          return (
            <button
              key={stage.id}
              onClick={() => {
                if (unlocked) {
                  onNavigate(stage.id);
                }
              }}
              disabled={!unlocked}
              className={cn(
                "flex flex-col items-center gap-3 py-4 px-1 flex-1 relative transition-all group",
                active 
                  ? "text-[#0071E3]" 
                  : "text-[var(--color-text-secondary)]",
                !unlocked && "opacity-20 cursor-not-allowed grayscale",
                unlocked && !active && "hover:text-[var(--color-text-primary)] cursor-pointer"
              )}
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500",
                active 
                  ? "bg-[#0071E3]/10 shadow-inner" 
                  : "bg-transparent group-hover:bg-[var(--color-slate-elevated)]"
              )}>
                <Icon size={22} strokeWidth={active ? 2.5 : 1.5} className={cn("transition-transform duration-500", active && "scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.25em] transition-opacity",
                active ? "opacity-100" : "opacity-30 group-hover:opacity-60"
              )}>
                {stage.label}
              </span>
              
              {/* Active Indicator Bar */}
              {active && (
                <motion.div 
                  layoutId="phaseIndicator"
                  className="absolute bottom-0 left-3 right-3 h-[4px] bg-[#0071E3] rounded-t-full shadow-[0_-4px_15px_rgba(0,113,227,0.4)]"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
