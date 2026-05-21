import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, AlertTriangle, Zap, Target, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { ActionableInsight } from '../../types';
import { cn } from '../../lib/utils';

interface ActionableInsightsCardProps {
  insights: ActionableInsight[];
  isLoading: boolean;
  onAction?: (action: ActionableInsight) => void;
}

export const ActionableInsightsCard: React.FC<ActionableInsightsCardProps> = ({ 
  insights, 
  isLoading,
  onAction 
}) => {
  return (
    <div className="w-full max-w-5xl mx-auto mt-16 mb-24 px-6 animate-matrix">
      <div className="bg-[var(--color-card-bg)] border border-[var(--color-border-default)] rounded-[48px] shadow-sm overflow-hidden min-h-[160px] flex flex-col">
        <div className="px-10 py-8 glass-panel border-b border-[var(--color-border-default)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-2xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]",
              isLoading && "animate-pulse"
            )}>
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Brain size={24} strokeWidth={1.5} />}
            </div>
            <div>
              <h3 className="text-[14px] font-black text-[var(--color-text-primary)] uppercase tracking-[0.3em]">Actionable Intelligence</h3>
              <p className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest mt-1">Strategic Synthesis Engine</p>
            </div>
          </div>
          {isLoading && (
            <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] animate-pulse">
              Gemini is synthesizing...
            </span>
          )}
        </div>

        <div className="p-12">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                {[1, 2, 3].map(i => (
                  <div key={i} className="space-y-6 animate-pulse">
                    <div className="h-4 w-28 bg-[var(--color-slate-elevated)] rounded-full" />
                    <div className="space-y-3">
                        <div className="h-6 w-full bg-[var(--color-slate-elevated)] rounded-xl" />
                        <div className="h-20 w-full bg-[var(--color-slate-elevated)] rounded-2xl" />
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : insights.length > 0 ? (
              <motion.div 
                key="content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-10"
              >
                {insights.map((insight, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col h-full group"
                  >
                    <div className="flex items-center gap-2.5 mb-6">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        insight.type === 'warning' ? "bg-rose-500/10 text-rose-500" : 
                        insight.type === 'opportunity' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                      )}>
                        {insight.type === 'warning' && <AlertTriangle size={14} />}
                        {insight.type === 'opportunity' && <Sparkles size={14} />}
                        {insight.type === 'action' && <Zap size={14} />}
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em]",
                        insight.type === 'warning' ? "text-rose-500" : 
                        insight.type === 'opportunity' ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {insight.type}
                      </span>
                      {insight.urgency === 'before_next_stage' && (
                        <span className="ml-auto text-[9px] font-black bg-[var(--color-text-primary)] text-[var(--color-card-bg)] px-2.5 py-1 rounded-full uppercase tracking-widest">
                          Critical
                        </span>
                      )}
                    </div>

                    <h4 className="text-[17px] font-bold text-[var(--color-text-primary)] leading-tight mb-4 group-hover:text-[#0071E3] transition-colors">
                      {insight.title}
                    </h4>
                    
                    <p className="text-[13px] text-[var(--color-text-secondary)] font-medium leading-relaxed mb-8 flex-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      {insight.observation}
                    </p>

                    <div className="mt-auto pt-6 border-t border-[var(--color-border-default)] space-y-5">
                      <div className="flex items-start gap-3">
                        <Target size={16} className="text-[#0071E3] mt-1 shrink-0" />
                        <p className="text-[14px] font-extrabold text-[var(--color-text-primary)] leading-snug">
                          {insight.action}
                        </p>
                      </div>

                      <button
                        onClick={() => onAction?.(insight)}
                        className="group/exec flex items-center gap-3 text-[11px] font-black text-[#0071E3] uppercase tracking-[0.25em] hover:opacity-70 transition-all"
                      >
                        Launch Implementation <ArrowRight size={14} className="group-hover/exec:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">
                <div className="w-16 h-16 bg-[var(--color-slate-elevated)] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] opacity-30">
                  <Brain size={32} />
                </div>
                <div className="space-y-2">
                  <p className="text-[15px] font-bold text-[var(--color-text-primary)]">Ready for Analysis</p>
                  <p className="text-[12px] font-medium text-[var(--color-text-secondary)] opacity-60">Complete the current strategic stage to unlock actionable matrix intelligence.</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
