import React from 'react';
import { motion } from 'motion/react';
import { ChevronDown, Plus, Home, Sparkles, UserCircle2, Building2, Sun, Moon } from 'lucide-react';
import { Company, Progress } from '../types';
import { cn } from '../lib/utils';

interface ModuleHeaderProps {
  moduleName: string;
  company?: Company;
  allCompanies: Company[];
  progress?: Record<string, Progress>;
  onSelectCompany: (id: string) => void;
  onAddCompany: () => void;
  onGoHome: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const ModuleHeader: React.FC<ModuleHeaderProps> = ({ 
  moduleName, 
  company, 
  allCompanies, 
  progress = {},
  onSelectCompany, 
  onAddCompany,
  onGoHome,
  theme,
  onToggleTheme
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="w-full bg-[var(--color-card-bg)]/80 backdrop-blur-2xl border-b border-[var(--color-border-default)] sticky top-0 z-[60]">
      <div className="flex items-center justify-between max-w-[1000px] mx-auto py-5 px-6">
        <div className="flex items-center gap-4 sm:gap-8">
          <button 
            onClick={onGoHome}
            className="w-11 h-11 flex items-center justify-center bg-[var(--color-slate-elevated)] hover:bg-[#0071E3] hover:text-white rounded-full transition-all text-[var(--color-text-secondary)] active:scale-95 border border-[var(--color-border-default)]"
            title="Back to Home"
          >
            <Home size={20} strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-3">
            <span className="hidden sm:block text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.4em] opacity-40">MATRIX</span>
            <span className="hidden sm:block text-[var(--color-border-default)] font-thin text-[20px]">/</span>
            <span className="text-[16px] sm:text-[18px] font-display font-extrabold text-[var(--color-text-primary)] tracking-tight">{moduleName}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-11 h-11 flex items-center justify-center bg-[var(--color-slate-elevated)] hover:bg-[#0071E3] hover:text-white rounded-full transition-all text-[var(--color-text-secondary)] border border-[var(--color-border-default)]"
            >
              {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
            </button>
          )}

          {company && (
            <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-3 pl-3 pr-5 py-2 rounded-full border border-[var(--color-border-default)] text-[14px] bg-[var(--color-card-bg)] hover:bg-[var(--color-slate-elevated)] transition-all h-12 shadow-sm active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-white border border-[var(--color-border-default)] flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {company.logoUrl ? (
                  <img src={company.logoUrl} alt={company.name} className="w-full h-full object-contain p-1.5" referrerPolicy="no-referrer" />
                ) : (
                  <Building2 size={16} className="text-[#1D1D1F]" />
                )}
              </div>
              <span className="max-w-[140px] hidden sm:block truncate font-extrabold text-[var(--color-text-primary)] tracking-tight uppercase text-[12px]">{company.name}</span>
              <ChevronDown size={14} className={cn("text-[var(--color-text-secondary)] transition-transform duration-500", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="absolute right-0 mt-3 w-80 bg-[var(--color-card-bg)] border border-[var(--color-border-default)] rounded-[32px] shadow-[0_30px_90px_rgba(0,0,0,0.3)] z-20 overflow-hidden"
                >
                  <div className="p-3 max-h-[440px] overflow-y-auto custom-scrollbar">
                    <div className="px-5 py-3 mb-2">
                       <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.3em]">Strategic Assets</span>
                    </div>
                    {allCompanies.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          onSelectCompany(c.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                            "w-full text-left px-5 py-4 rounded-2xl transition-all flex items-center justify-between group mb-1",
                            c.id === company.id ? "bg-[#0071E3]/5" : "hover:bg-[var(--color-slate-elevated)]"
                        )}
                      >
                        <div className="flex-1 min-w-0 flex items-center gap-4">
                          <div className={cn(
                            "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border transition-all duration-500",
                            c.id === company.id ? "bg-white border-[#0071E3]/20 shadow-md" : "bg-[var(--color-slate-elevated)] border-transparent group-hover:bg-white group-hover:border-[var(--color-border-default)] group-hover:shadow-sm"
                          )}>
                             {c.logoUrl ? (
                               <img src={c.logoUrl} alt={c.name} className="w-full h-full object-contain p-2.5" referrerPolicy="no-referrer" />
                             ) : (
                               <Sparkles size={18} className="text-[var(--color-text-secondary)]" strokeWidth={1.5} />
                             )}
                          </div>
                          <div className="min-w-0">
                            <div className={cn("text-[16px] font-extrabold truncate tracking-tight transition-colors", c.id === company.id ? "text-[#0071E3]" : "text-[var(--color-text-primary)]")}>{c.name}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-[var(--color-text-secondary)] truncate font-black uppercase tracking-widest">{c.industry}</span>
                            </div>
                          </div>
                        </div>
                        {c.id === company.id && (
                          <div className="w-2 h-2 rounded-full bg-[#0071E3] shadow-[0_0_12px_#0071E3]" />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      onAddCompany();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-8 py-6 border-t border-[var(--color-border-default)] text-[11px] text-[#0071E3] font-black uppercase tracking-[0.2em] bg-[var(--color-slate-elevated)] hover:bg-[#0071E3] hover:text-white transition-all flex items-center gap-4"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#0071E3]/10 flex items-center justify-center group-hover:bg-white/20">
                      <Plus size={18} strokeWidth={3} />
                    </div>
                    Deploy New Project
                  </button>
                </motion.div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
