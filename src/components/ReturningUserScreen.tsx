import React from 'react';
import { Plus, ChevronRight, Building2, Calendar, Target, Edit2, Trash2, X, AlertTriangle, Copy, Check, Sparkles, UserCircle2, ArrowRight, Sun, Moon } from 'lucide-react';
import { Company, Progress, Offer } from '../types';
import { cn } from '../lib/utils';
import { PhaseSelectionModal } from './PhaseSelectionModal';
import { EmptyState } from './EmptyState';
import { motion, AnimatePresence } from 'motion/react';

interface ReturningUserScreenProps {
  companies: Company[];
  companyProgress: Record<string, Progress>;
  needsOfferUpdate: Record<string, boolean>;
  offers: Record<string, Offer>;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectCompany: (id: string) => void;
  onEditCompany: (id: string, phase: 'company' | 'offer' | 'avatar') => void;
  onDeleteCompany: (id: string) => void;
  onAddNewCompany: () => void;
  onDataImported?: () => void;
}

export const ReturningUserScreen: React.FC<ReturningUserScreenProps> = ({ 
  companies, 
  companyProgress, 
  needsOfferUpdate,
  offers,
  theme,
  onToggleTheme,
  onSelectCompany, 
  onEditCompany,
  onDeleteCompany,
  onAddNewCompany,
  onDataImported
}) => {
  const [selectedProjectId, setSelectedProjectId] = React.useState<string | null>(null);
  const [isPhaseModalOpen, setIsPhaseModalOpen] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = () => {
    if (projectToDelete) {
      setIsDeleting(true);
      setTimeout(() => {
        onDeleteCompany(projectToDelete);
        setProjectToDelete(null);
        setIsDeleting(false);
      }, 300);
    }
  };

  return (
    <div className="min-h-screen pb-32 font-sans text-[var(--color-text-primary)]">
      <AnimatePresence>
        {projectToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProjectToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#1D1D1F] rounded-[40px] p-10 shadow-2xl border border-[var(--color-border-default)]"
            >
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center text-red-500">
                   <AlertTriangle size={32} />
                </div>
                <div>
                   <h3 className="text-[24px] font-display font-bold text-[var(--color-text-primary)] mb-2">Delete Project?</h3>
                   <p className="text-[15px] text-[var(--color-text-secondary)] leading-relaxed">
                     This will permanently remove <span className="font-bold text-[var(--color-text-primary)]">"{companies.find(c => c.id === projectToDelete)?.name}"</span> and all associated intelligence assets.
                   </p>
                </div>
                <div className="flex flex-col w-full gap-3">
                   <button 
                     onClick={handleDelete}
                     disabled={isDeleting}
                     className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50"
                   >
                     {isDeleting ? "Wiping Archive..." : "Delete Permanently"}
                   </button>
                   <button 
                     onClick={() => setProjectToDelete(null)}
                     className="w-full py-4 bg-[var(--color-slate-elevated)] text-[var(--color-text-primary)] rounded-2xl font-bold border border-[var(--color-border-default)]"
                   >
                     Cancel
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-[1100px] mx-auto px-6 pt-12 sm:pt-24">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 mb-16 sm:mb-24 animate-matrix">
          <div className="space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 glass-panel rounded-full shadow-sm border border-[var(--color-border-default)] font-mono">
                <div className="w-1.5 h-1.5 bg-[#0071E3] rounded-full animate-pulse" />
                <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.3em]">Neural Archive: Active</span>
            </div>
            <h1 className="text-[48px] sm:text-[72px] font-display font-extrabold tracking-tight leading-[1.05] text-[var(--color-text-primary)]">Intelligence<br /><span className="text-[#0071E3]">Matrix</span></h1>
            <p className="text-[18px] sm:text-[22px] text-[var(--color-text-secondary)] font-bold dark:font-medium leading-relaxed max-w-[540px]">Architecting market authority with precision-crafted intelligence modeling.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
            {onToggleTheme && (
              <button 
                onClick={onToggleTheme}
                className="btn-secondary h-[64px] px-6 rounded-3xl flex items-center justify-center gap-3 border-[#D2D2D7] dark:border-white/10"
              >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                <span className="text-[14px] font-bold uppercase tracking-widest sm:hidden">Switch Theme</span>
              </button>
            )}
            <button 
              onClick={onAddNewCompany}
              className="btn-primary group flex items-center gap-5 py-5 px-12 shadow-2xl shadow-[#0071E3]/20 flex-1 sm:flex-none justify-center"
            >
              <span className="text-[16px] font-extrabold uppercase tracking-widest">Launch Project</span>
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center transition-transform group-hover:rotate-90">
                  <Plus size={16} strokeWidth={3} />
              </div>
            </button>
          </div>
        </header>

        <div className="space-y-10">
          {companies.length === 0 ? (
            <EmptyState 
              icon={Building2}
              title="Build Your First Intelligence Asset"
              description="Define your brand identity and craft high-converting marketing offers with algorithmic precision."
              action={{
                label: "Launch Initial Project",
                onClick: onAddNewCompany
              }}
              className="p-16 sm:p-24"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-12 pb-24">
              {companies.map((company, index) => {
                const progress = companyProgress[company.id];
                const isCompComplete = progress?.stage1Complete;
                const isOfferComplete = progress?.stage2Complete;
                const isModelComplete = progress?.stage3Complete;
                const offerNeedsUpdate = needsOfferUpdate[company.id];
                const activeOffer = offers[company.id];
                
                return (
                  <motion.div
                    key={company.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 1, ease: [0.23, 1, 0.32, 1] }}
                    className="group"
                  >
                    <div className="relative bg-white dark:bg-[#1D1D1F] border border-[#D2D2D7]/60 dark:border-white/5 rounded-[48px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:shadow-none hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] transition-all duration-700">
                      <div className="flex flex-col lg:flex-row h-full">
                        {/* Project Identity Section */}
                        <div className="lg:w-1/3 p-10 bg-[#F5F5F7] dark:bg-white/5 border-b lg:border-b-0 lg:border-r border-[#D2D2D7] dark:border-white/5 flex flex-col justify-between">
                          <div className="space-y-8">
                             <div className="flex items-center justify-between">
                                {company.logoUrl ? (
                                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#D2D2D7] flex items-center justify-center p-3 shadow-md overflow-hidden group-hover:scale-105 transition-transform duration-700">
                                    <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  </div>
                                ) : (
                                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-white/10 text-[var(--color-text-primary)] flex items-center justify-center border border-[#D2D2D7] dark:border-[var(--color-border-default)] shadow-sm">
                                    <Building2 size={24} />
                                  </div>
                                )}
                                <button 
                                  onClick={() => setProjectToDelete(company.id)}
                                  className="w-10 h-10 flex items-center justify-center text-[var(--color-text-secondary)] hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                             </div>

                             <div className="space-y-4">
                                <h3 className="text-[32px] font-display font-black text-[var(--color-text-primary)] leading-tight">{company.name}</h3>
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] rounded-lg">
                                    {company.industry}
                                  </span>
                                  {company.specializations?.[0] && (
                                    <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-white dark:bg-white/10 text-[var(--color-text-primary)] dark:text-[var(--color-text-secondary)] border border-[#D2D2D7] dark:border-[var(--color-border-default)] rounded-lg shadow-sm">
                                      {company.specializations[0].name}
                                    </span>
                                  )}
                                </div>
                             </div>
                          </div>

                          <div className="mt-12">
                             <button 
                               onClick={() => onSelectCompany(company.id)}
                               className="btn-primary w-full py-4 flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl transition-all"
                             >
                               <span className="uppercase tracking-widest text-[12px]">Open Console</span>
                               <ArrowRight size={16} />
                             </button>
                          </div>
                        </div>

                        {/* Synthesis Status Section */}
                        <div className="flex-1 p-10 flex flex-col justify-between bg-white dark:bg-transparent">
                            <div className="space-y-8">
                               <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.3em] opacity-100">Development Lifecycle</span>
                                  <div className="flex items-center gap-2">
                                     <div className={cn("w-2 h-2 rounded-full", isModelComplete ? "bg-emerald-500" : isOfferComplete ? "bg-emerald-500/50" : "bg-amber-500 animate-pulse")} />
                                     <span className="text-[10px] font-black text-[var(--color-text-primary)] uppercase tracking-widest">
                                        {isModelComplete ? "Master Synthesis" : isOfferComplete ? "Strategy Verified" : "Initialization"}
                                     </span>
                                  </div>
                               </div>

                               <div className="grid grid-cols-3 gap-6">
                                  <PhaseIndicator 
                                    label="Identity" 
                                    isDone={isCompComplete} 
                                    onClick={() => onEditCompany(company.id, 'company')} 
                                  />
                                  <PhaseIndicator 
                                    label="Strategy" 
                                    isDone={isOfferComplete} 
                                    isWarning={offerNeedsUpdate}
                                    onClick={() => onEditCompany(company.id, 'offer')} 
                                    disabled={!isCompComplete}
                                  />
                                  <PhaseIndicator 
                                    label="Modeling" 
                                    isDone={isModelComplete} 
                                    onClick={() => onEditCompany(company.id, 'avatar')} 
                                    disabled={!isOfferComplete}
                                  />
                               </div>

                               {activeOffer && (
                                 <div className="p-6 bg-[#F5F5F7] dark:bg-white/5 rounded-3xl border border-[#D2D2D7] dark:border-white/10 shadow-inner">
                                    <div className="flex items-center gap-2 mb-3">
                                       <Sparkles size={12} className="text-amber-500" />
                                       <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest">Core Hook Analysis</span>
                                    </div>
                                    <p className="text-[14px] font-medium text-[var(--color-text-primary)] line-clamp-2 leading-relaxed italic opacity-90 dark:opacity-80">
                                      “{activeOffer.generatedOffer}”
                                    </p>
                                 </div>
                               )}
                            </div>

                            <div className="mt-10 flex items-center justify-between border-t border-[#D2D2D7] dark:border-white/5 pt-8">
                                <div className="flex items-center gap-10">
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest opacity-100 mb-1">Created</span>
                                      <span className="text-[13px] font-bold text-[var(--color-text-primary)]">{new Date(company.createdAt).toLocaleDateString()}</span>
                                   </div>
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest opacity-100 mb-1">Intelligence Depth</span>
                                      <span className="text-[13px] font-bold text-[var(--color-text-primary)]">{progress?.avatars?.length || 0} Avatars Mapped</span>
                                   </div>
                                </div>
                                <div className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest opacity-100 whitespace-nowrap">
                                  {company.country} Market
                                </div>
                            </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PhaseIndicator = ({ label, isDone, isWarning, onClick, disabled }: any) => (
  <button 
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex flex-col gap-4 p-5 rounded-3xl border transition-all text-left group/phase",
      disabled ? "opacity-30 grayscale border-dashed border-[#D2D2D7] cursor-not-allowed" : 
      isDone ? "bg-emerald-500/[0.04] border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/[0.08]" :
      isWarning ? "bg-amber-500/[0.04] border-amber-500/40 text-amber-600 hover:bg-amber-500/[0.08] animate-pulse" :
      "bg-white dark:bg-[var(--color-slate-elevated)] border-[#D2D2D7] dark:border-white/10 text-[var(--color-text-secondary)] hover:border-[#0071E3]/60 hover:bg-[#0071E3]/[0.02] shadow-sm"
    )}
  >
    <div className={cn(
      "w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover/phase:scale-110",
      isDone ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : isWarning ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-[#F5F5F7] dark:bg-white/10 border border-[#D2D2D7] dark:border-white/5 shadow-inner"
    )}>
      {isDone ? <Check size={14} strokeWidth={3} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
    </div>
    <span className="text-[12px] font-black uppercase tracking-widest text-[var(--color-text-primary)]">{label}</span>
  </button>
);

const StageCard = ({ title, subtitle, icon: Icon, isComplete, isWarning, disabled, onClick }: any) => (
  <button 
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "flex flex-col items-start gap-8 p-8 card-premium group/card text-left transition-all duration-500",
      disabled ? "opacity-30 grayscale cursor-not-allowed border-dashed bg-transparent shadow-none" : "hover:border-[#0071E3]/30"
    )}
  >
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-sm",
      isComplete ? "bg-emerald-500 text-white shadow-emerald-500/20" : 
      isWarning ? "bg-amber-500 text-white animate-pulse" :
      "bg-[var(--color-slate-elevated)] text-[#0071E3] group-hover/card:scale-110 group-hover/card:rotate-3"
    )}>
      {isComplete ? <Check size={28} strokeWidth={3} /> : <Icon size={28} strokeWidth={1.5} />}
    </div>
    
    <div className="space-y-1">
      <h3 className="text-premium-sm">{title}</h3>
      <div className="text-[17px] font-bold font-mono tracking-tight text-[var(--color-text-primary)]">
        {isComplete ? (
          <span className="text-emerald-500 uppercase tracking-wider">{subtitle}</span>
        ) : isWarning ? (
          <span className="text-amber-500 uppercase tracking-wider">{subtitle}</span>
        ) : (
          <span className="opacity-50 uppercase tracking-wider">{subtitle}</span>
        )}
      </div>
    </div>
    
    {!disabled && (
       <div className="mt-auto pt-6 w-full flex justify-end">
          <ChevronRight size={18} className="text-[var(--color-border-default)] group-hover/card:text-[#0071E3] group-hover/card:translate-x-1 transition-all" />
       </div>
    )}
  </button>
);
