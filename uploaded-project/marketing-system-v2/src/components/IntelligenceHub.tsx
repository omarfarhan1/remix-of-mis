import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, ChevronRight, Brain, Sparkles, Filter, MoreHorizontal, ArrowRight, BarChart3, Maximize2, Minimize2, Zap, Quote, RefreshCw, TrendingUp, Trash2, Moon, Sun } from 'lucide-react';
import { Company, Avatar, Offer } from '../types';
import { cn } from '../lib/utils';
import { AvatarDeepDiveCard } from './stage3/AvatarDeepDiveCard';
import { generateSubAvatars } from '../services/avatarService';
import { ValuePyramid } from './intel/ValuePyramid';
import { OfferScoreCard } from './intel/OfferScoreCard';

import { EmptyState } from './EmptyState';

interface IntelligenceHubProps {
  isOpen: boolean;
  onClose: () => void;
  companies: Company[];
  offers: Record<string, Offer>;
  companyProgress: Record<string, any>;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSelectCompany: (id: string) => void;
  onConsolidateOffer?: (companyId: string) => void;
  onUpdateAvatar?: (companyId: string, avatar: Avatar) => void;
}

export const IntelligenceHub: React.FC<IntelligenceHubProps> = ({ 
  isOpen, 
  onClose, 
  companies, 
  offers,
  companyProgress, 
  theme,
  onToggleTheme,
  onSelectCompany,
  onConsolidateOffer,
  onUpdateAvatar
}) => {
  const [selectedAvatar, setSelectedAvatar] = React.useState<Avatar | null>(null);
  const [showPyramid, setShowPyramid] = React.useState(false);
  const [isAvatarMaximized, setIsAvatarMaximized] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'overview' | 'avatars' | 'offers'>('overview');
  const [showHistory, setShowHistory] = React.useState(false);
  const [showAvatarOfferOnly, setShowAvatarOfferOnly] = React.useState(false);

  // Group all avatars from all companies
  const allAvatars = companies.flatMap(c => {
    const avatars = companyProgress[c.id]?.avatars;
    if (!Array.isArray(avatars)) return [];
    return avatars
      .filter((a: Avatar) => !a.parentId) // Only show top-level avatars in the hub
      .map((a: Avatar) => ({ ...a, companyName: c.name }));
  });

  const allActionItems = allAvatars.flatMap(a => (a.executionPlan || []).map(item => ({ ...item, avatarName: a.name })));

  const avatarsWithOffers = allAvatars.filter(a => a.targetedOffer);

  const { primaryAvatars, secondaryAvatars, lowPriorityAvatars } = React.useMemo(() => {
    const p: any[] = [];
    const s: any[] = [];
    const l: any[] = [];
    allAvatars.forEach(a => {
      const priority = a.uiMetadata?.priorityLabel || 'secondary';
      if (priority === 'primary') p.push(a);
      else if (priority === 'secondary') s.push(a);
      else l.push(a);
    });
    return { primaryAvatars: p, secondaryAvatars: s, lowPriorityAvatars: l };
  }, [allAvatars]);

  const handleGenerateSubAvatars = async (parent: Avatar) => {
    try {
      const company = companies.find(c => c.id === parent.companyId);
      const offer = companyProgress[parent.companyId]?.coreOffer;
      if (!company || !offer) return;

      const subAvatars = await generateSubAvatars(parent, company, offer);
      
      // Update each sub-avatar into the system
      if (onUpdateAvatar) {
        for (const sub of subAvatars) {
          onUpdateAvatar(company.id, sub);
        }
      }
    } catch (error) {
      console.error('Error generating sub-avatars:', error);
    }
  };

  // Lock body scroll when open
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isOpen]);

  const learningStats = React.useMemo(() => {
    const totalCompanies = companies.length;
    const totalAvatars = allAvatars.length;
    const totalDeepDives = allAvatars.filter(a => a.demographics).length;
    const maturity = Math.min(Math.round((totalCompanies * 20) + (totalAvatars * 5) + (totalDeepDives * 10)), 100);
    
    return {
      totalCompanies,
      totalAvatars,
      totalDeepDives,
      maturity,
      status: maturity > 80 ? 'Mastery' : maturity > 40 ? 'Synthesizing' : 'Initializing'
    };
  }, [companies, allAvatars]);

  const calculateDepth = (comp: Company) => {
    const prog = companyProgress[comp.id];
    let score = 0;
    
    // Core Progress (Max 45)
    if (prog?.stage1Complete) score += 15;
    if (prog?.stage2Complete) score += 15;
    if (prog?.stage3Complete) score += 15;
    
    // Intelligence Depth (Max 55)
    const avatars = prog?.avatars || [];
    const deepDivedCount = avatars.filter((a: any) => a.demographics).length;
    const subAvatarsCount = avatars.filter((a: any) => a.parentId).length;
    
    // Each deep dive adds 10% (cap at 40%)
    score += Math.min(deepDivedCount * 10, 40);
    
    // Each sub-avatar adds 3% (cap at 15%)
    score += Math.min(subAvatarsCount * 3, 15);
    
    return Math.min(score, 100);
  };

  const avgDepth = companies.length > 0 
    ? Math.round(companies.reduce((acc, c) => acc + calculateDepth(c), 0) / companies.length)
    : 0;

  const getMissingNodes = (comp: Company) => {
    const prog = companyProgress[comp.id];
    const missing = [];
    if (!prog?.stage2Complete) missing.push("OFFER_BUILDER_UNINITIALIZED");
    if (!prog?.stage3Complete) missing.push("PSYCHOGRAPHICS_PENDING");
    if (!prog?.avatars?.some((a: any) => a.elementsOfValue?.length > 0)) missing.push("VALUE_ASSETS_UNMAPPED");
    return missing;
  };

  const missingNodes = companies[0] ? getMissingNodes(companies[0]) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 440, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="h-full bg-[var(--color-primary-bg)] shadow-2xl z-[70] flex flex-col border-r border-[var(--color-border-default)] shrink-0 relative overflow-hidden hidden lg:flex"
            >
            <div className="p-8 pb-6 glass-panel sticky top-0 z-20 border-b border-[#D2D2D7]/60 dark:border-[var(--color-border-default)]">
              <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4 text-left">
                    <div className="relative">
                       <div className="w-12 h-12 bg-[#1D1D1F] dark:bg-white dark:text-[#1D1D1F] rounded-2xl text-white flex items-center justify-center shadow-lg">
                         <Brain size={24} strokeWidth={2} />
                      </div>
                      <motion.div 
                        animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.8, 0.3] }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                        className="absolute -top-1 -right-1 w-3 h-3 bg-[#0071E3] rounded-full blur-[2px]" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                       <h2 className="text-[18px] font-display font-bold tracking-tight text-[var(--color-text-primary)] truncate">Intelligence Matrix</h2>
                       <div className="flex items-center gap-2 mt-0.5">
                          <div className="h-1 flex-1 bg-[var(--color-border-default)] rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${avgDepth}%` }}
                               className="h-full bg-[#0071E3]"
                             />
                          </div>
                          <span className="text-[9px] text-[#0071E3] font-mono font-black uppercase tracking-[0.1em]">{avgDepth}%_RESONANCE</span>
                       </div>
                    </div>
                  </div>
                
                <div className="flex items-center gap-2">
                  {onToggleTheme && (
                    <button 
                      onClick={onToggleTheme}
                      className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-slate-elevated)] rounded-full transition-all text-[var(--color-text-secondary)] active:scale-90"
                    >
                      {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                  )}
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center hover:bg-[var(--color-slate-elevated)] rounded-full transition-all text-[var(--color-text-secondary)] active:scale-90"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="bg-[#F0F0F2] dark:bg-[var(--color-slate-elevated)] p-1 rounded-[20px] flex gap-1 border border-[#D2D2D7] dark:border-[var(--color-border-default)]">
                 {['overview', 'avatars', 'offers'].map((tab) => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab as any)}
                     className={cn(
                       "flex-1 py-3 rounded-[16px] text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300",
                       activeTab === tab ? "bg-white dark:bg-[var(--color-card-bg)] text-[var(--color-text-primary)] shadow-md border border-[#D2D2D7] dark:border-[var(--color-border-default)]" : "text-[var(--color-text-secondary)] opacity-80 dark:opacity-100 hover:opacity-100 hover:text-[var(--color-text-primary)]"
                     )}
                   >
                     {tab}
                   </button>
                 ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-10">
              {activeTab === 'overview' && (
                <>
                  {/* Neural Synthesis Maturity - Learning Analysis */}
                  {companies.length > 0 && (
                    <div className="bg-[#F0F0F2] dark:bg-[var(--color-slate-elevated)]/50 rounded-[32px] p-8 border border-[#D2D2D7] dark:border-[var(--color-border-default)] space-y-6 relative overflow-hidden shadow-sm">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071E3]/5 blur-3xl -mr-16 -mt-16" />
                      
                      <div className="flex items-center justify-between relative z-10 text-left">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-[#0071E3]/10 flex items-center justify-center text-[#0071E3]">
                            <Brain size={16} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.3em] opacity-100 dark:opacity-100">Strategic Depth</span>
                            <span className="text-[9px] font-black text-[#0071E3] uppercase tracking-widest">{learningStats.status} Phase</span>
                          </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[24px] font-display font-black text-[var(--color-text-primary)]">{learningStats.maturity}%</span>
                           <span className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest block opacity-100 dark:opacity-40">Resonance</span>
                        </div>
                      </div>

                      <div className="h-1.5 w-full bg-[var(--color-card-bg)] rounded-full overflow-hidden border border-[var(--color-border-default)]">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${learningStats.maturity}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="h-full bg-[#0071E3] rounded-full"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2 text-left">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] opacity-50">Assets Mapped:</span>
                          <div className="text-[13px] font-bold text-[var(--color-text-primary)]">{learningStats.totalCompanies} Brands / {learningStats.totalAvatars} Avatars</div>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] opacity-50">Deeper Insights:</span>
                          <div className="text-[13px] font-bold text-[var(--color-text-primary)]">{learningStats.totalDeepDives} Core Extractions</div>
                        </div>
                      </div>

                      <div className="p-4 bg-[var(--color-card-bg)] rounded-[24px] border border-[var(--color-border-default)] text-left">
                         <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed italic">
                            "{learningStats.maturity > 60 
                              ? "Models have stabilized. High predictive accuracy for conversion hooks across multiple industry vectors." 
                              : "Initializing neural patterns. Requires more avatar deep-dives to solidify cross-segment conversion logic."}"
                         </p>
                      </div>

                      <div className="pt-2">
                        <h4 className="text-[10px] font-black text-[var(--color-text-secondary)] uppercase tracking-[0.2em] mb-3 px-1">Resonance Path:</h4>
                        <div className="space-y-2">
                           {[
                             { label: 'Complete Company Profile', value: '+25%' },
                             { label: 'Generate Core Offer', value: '+25%' },
                             { label: 'Map Market Archetypes', value: '+25%' },
                             { label: 'Complete Empathy Deep Dives', value: '+25%' }
                           ].map((item, i) => (
                             <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border-default)]">
                                <span className="text-[11px] font-bold text-[var(--color-text-primary)]">{item.label}</span>
                                <span className="text-[10px] font-black text-[#0071E3]">{item.value}</span>
                             </div>
                           ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Market Assets Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-premium-sm">Active Brands</h3>
                       <span className="bg-[var(--color-slate-elevated)] text-[var(--color-text-primary)] px-2.5 py-1 rounded-full text-[10px] font-black border border-[var(--color-border-default)]">
                        {companies.length}
                       </span>
                    </div>
                    
                    {companies.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {companies.map(c => (
                          <button
                            key={c.id}
                            onClick={() => {
                              onSelectCompany(c.id);
                              onClose();
                            }}
                            className="p-5 group/item text-left flex flex-col gap-4 aspect-square bg-white dark:bg-[var(--color-slate-elevated)] border border-[#D2D2D7]/50 dark:border-[var(--color-border-default)] rounded-[32px] hover:border-[#0071E3] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] dark:hover:shadow-none transition-all duration-500"
                          >
                            <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] dark:bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-[#D2D2D7]/30 dark:border-white/5 group-hover/item:scale-110 transition-transform duration-500 shadow-sm">
                              {c.logoUrl ? <img src={c.logoUrl} alt="" className="w-full h-full object-contain p-2" /> : <Building2 size={18} className="text-[var(--color-text-secondary)]" />}
                            </div>
                            <div className="flex-1">
                               <div className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] leading-tight mb-1 line-clamp-2">{c.name}</div>
                               <div className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest opacity-60">
                                  {companyProgress[c.id]?.stage2Complete ? "Strategic" : "Draft"}
                               </div>
                            </div>
                            <div className="mt-auto flex items-center justify-between">
                              <span className="text-[10px] font-bold text-[#0071E3] opacity-0 group-hover/item:opacity-100 transition-opacity">Manage</span>
                              <ArrowRight size={12} className="text-[#0071E3] opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all" />
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed border-[#D2D2D7]/40 rounded-[32px] text-center">
                        <p className="text-[12px] text-[#86868B] font-medium">No projects found.</p>
                      </div>
                    )}
                  </div>
                </>
              )}

            {activeTab === 'avatars' ? (
              <>
                {/* Persona Bento Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                     <h3 className="text-premium-sm">Empathy Models</h3>
                     <span className="bg-[#0071E3] text-white px-2.5 py-1 rounded-full text-[10px] font-black">
                      {allAvatars.length}
                     </span>
                  </div>
                   
                  {allAvatars.length > 0 ? (
                    <div className="space-y-6">
                      {primaryAvatars.length > 0 && (
                        <div className="grid grid-cols-1 gap-3">
                          {primaryAvatars.map((avatar: any) => {
                            const avatarUrl = avatar.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                            return (
                              <button 
                                key={avatar.id}
                                onClick={() => {
                                  setSelectedAvatar(avatar);
                                  setShowAvatarOfferOnly(false);
                                }}
                                className="bento-card p-5 group flex items-center gap-5"
                              >
                                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-[var(--color-slate-elevated)] border border-[#0071E3]/30 dark:border-[#0071E3]/20 overflow-hidden shrink-0 group-hover:rotate-3 transition-transform duration-500 shadow-sm">
                                     <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                  </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <div className="px-1.5 py-0.5 bg-[#0071E3]/10 text-[#0071E3] text-[8px] font-black rounded uppercase tracking-widest">Primary</div>
                                      <h4 className="text-[16px] font-bold tracking-tight text-[var(--color-text-primary)] truncate text-left">{avatar.name}</h4>
                                    </div>
                                    <div className="text-[10px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest truncate text-left">
                                       {avatar.companyName}
                                    </div>
                                 </div>
                                 <ChevronRight size={16} className="text-[var(--color-text-placeholder)] group-hover:translate-x-1 transition-transform" />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        {secondaryAvatars.map((avatar: any) => {
                          const avatarUrl = avatar.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;
                          return (
                            <button 
                              key={avatar.id}
                              onClick={() => {
                                setSelectedAvatar(avatar);
                                setShowAvatarOfferOnly(false);
                              }}
                              className="bento-card p-5 group text-left flex flex-col gap-3"
                            >
                               <div className="w-10 h-10 rounded-xl bg-[var(--color-slate-elevated)] border border-[var(--color-border-default)] overflow-hidden shrink-0">
                                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                               </div>
                               <div className="flex-1">
                                  <div className="text-[14px] font-bold tracking-tight text-[var(--color-text-primary)] line-clamp-1">{avatar.name}</div>
                                  <div className="text-[9px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest truncate">
                                    {avatar.companyName}
                                  </div>
                               </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-10 border-2 border-dashed border-[var(--color-border-default)] rounded-[32px] text-center flex flex-col items-center gap-4">
                       <div className="w-16 h-16 rounded-full bg-[var(--color-card-bg)] flex items-center justify-center text-[var(--color-text-placeholder)] border border-[var(--color-border-default)]">
                          <Filter size={24} />
                       </div>
                       <p className="text-[13px] text-[var(--color-text-secondary)] font-medium leading-relaxed">No avatars defined yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : activeTab === 'offers' ? (
              <div className="space-y-10">
                 {/* Global Core Offer Section */}
                 <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-premium-sm">Core Philosophy</h3>
                       {companies[0] && offers[companies[0].id]?.history && (
                         <button 
                           onClick={() => setShowHistory(!showHistory)}
                           className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest hover:bg-[#0071E3]/5 px-3 py-1.5 rounded-full transition-all"
                         >
                           {showHistory ? "← Back" : "History"}
                         </button>
                       )}
                    </div>

                    {companies.length > 0 ? (
                      <div className="space-y-6">
                         {companies[0] && offers[companies[0].id] ? (
                           <>
                             {companyProgress[companies[0].id]?.scoreDelta && !showHistory && (
                               <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-[32px] space-y-4">
                                 <div className="flex items-center gap-2">
                                   <div className="p-1.5 bg-emerald-500 rounded-lg text-white">
                                      <TrendingUp size={14} />
                                   </div>
                                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                                     Score Delta: +{companyProgress[companies[0].id].scoreDelta.deltaTotal}
                                   </span>
                                 </div>
                                 <p className="text-[15px] font-bold text-emerald-950 leading-snug">
                                   {companyProgress[companies[0].id].scoreDelta.narrative}
                                 </p>
                               </div>
                             )}

                             {showHistory ? (
                               <div className="space-y-3">
                                  {offers[companies[0].id]?.history?.slice().reverse().map((h, i) => (
                                    <div key={i} className="bento-card p-6 opacity-60 hover:opacity-100">
                                       <div className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest mb-3">V.{offers[companies[0].id]!.history!.length - i}</div>
                                       <h5 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight mb-2 tracking-tight line-clamp-3">{h.generatedOffer}</h5>
                                       <span className="text-[10px] text-[var(--color-text-secondary)] font-bold">{h.generatedAt}</span>
                                    </div>
                                  ))}
                               </div>
                             ) : (
                               <div className="p-8 bg-[#1D1D1F] text-white rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
                                  <div className="absolute top-0 right-0 w-64 h-64 bg-[#0071E3]/30 blur-[100px] -mr-32 -mt-32" />
                                  <div className="space-y-6 relative z-10">
                                     <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                           <Sparkles size={14} className="text-[#0071E3]" />
                                           <span className="text-[9px] font-black text-[#0071E3] uppercase tracking-[0.2em]">Live Offer</span>
                                        </div>
                                        {companies[0] && offers[companies[0].id]?.score && (
                                          <div className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-black border border-white/10 uppercase tracking-widest">
                                             IQ: {offers[companies[0].id]?.score?.total}
                                          </div>
                                        )}
                                     </div>
                                     <p className="text-[16px] font-display font-semibold tracking-tight leading-tight">
                                        "{offers[companies[0].id]?.generatedOffer}"
                                     </p>
                                  </div>
                               </div>
                             )}
                           </>
                         ) : (
                           <div className="p-8 border-2 border-dashed border-[var(--color-border-default)] rounded-[32px] text-center">
                             <p className="text-[12px] text-[var(--color-text-secondary)] font-medium">No offer generated for {companies[0].name}.</p>
                           </div>
                         )}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Zap}
                        title="No Strategies"
                        description="Start a project to unlock strategic offer modeling."
                        className="p-8 shadow-none"
                      />
                    )}
                 </div>

                 {/* Targeted Avatar Offers Bento */}
                 <div className="space-y-6 pb-20">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="text-premium-sm">Segment Hypotheses</h3>
                       <span className="bg-[var(--color-slate-elevated)] text-[var(--color-text-primary)] px-2.5 py-1 rounded-full text-[10px] font-black border border-[var(--color-border-default)]">
                          {avatarsWithOffers.length}
                       </span>
                    </div>
                    
                    {avatarsWithOffers.length > 0 ? (
                      <div className="grid grid-cols-1 gap-3">
                         {avatarsWithOffers.map((avatar: any) => (
                           <button
                             key={avatar.id}
                             onClick={() => {
                               setSelectedAvatar(avatar);
                               setShowAvatarOfferOnly(true);
                             }}
                             className="bento-card p-6 text-left group relative"
                           >
                              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0071E3]/5 blur-[40px] -mr-16 -mt-16 group-hover:bg-[#0071E3]/10 transition-all duration-700" />
                              
                              <div className="space-y-4 relative z-10">
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded-lg bg-[#0071E3] text-white flex items-center justify-center shadow-lg shadow-[#0071E3]/10">
                                          <Zap size={14} />
                                       </div>
                                       <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.2em] truncate max-w-[120px]">{avatar.name}</span>
                                    </div>
                                    {avatar.targetedOffer.score && (
                                      <div className="px-2 py-0.5 bg-[var(--color-slate-elevated)] rounded-md text-[11px] font-black text-[var(--color-text-primary)] border border-[var(--color-border-default)]">
                                        {avatar.targetedOffer.score.total} IQ
                                      </div>
                                    )}
                                 </div>
                                 
                                 <div className="space-y-1">
                                    <h5 className="text-[16px] font-bold tracking-tight text-[var(--color-text-primary)] group-hover:text-[#0071E3] transition-colors leading-tight">
                                       {avatar.targetedOffer.offerName}
                                    </h5>
                                    <p className="text-[12px] text-[var(--color-text-secondary)] font-medium leading-relaxed italic line-clamp-2">
                                       "{avatar.targetedOffer.hook}"
                                    </p>
                                 </div>
                              </div>
                           </button>
                         ))}
                      </div>
                    ) : (
                      <div className="p-12 card-premium border-2 border-dashed border-[var(--color-border-default)] text-center flex flex-col items-center gap-5 bg-transparent shadow-none">
                         <div className="w-20 h-20 rounded-full bg-[var(--color-card-bg)] flex items-center justify-center text-[var(--color-text-placeholder)] border border-[var(--color-border-default)] shadow-sm animate-pulse">
                            <Zap size={32} />
                         </div>
                         <p className="text-[13px] text-[var(--color-text-secondary)] font-medium leading-relaxed max-w-[240px] mx-auto opacity-50">
                           Deep-dive into avatars to unlock segment-specific offers and smart scores.
                         </p>
                      </div>
                    )}
                 </div>
              </div>
            ) : null}
          </div>

          {/* Roadmap Dashboard (Only if there are persona insights) */}
          {allActionItems.length > 0 && activeTab === 'offers' && (
            <div className="px-6 pb-20 border-t border-[var(--color-border-default)] pt-10">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-premium-sm">Launch Roadmap</h3>
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black rounded uppercase tracking-widest animate-pulse">
                     Actionable
                  </span>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {allActionItems.map((item: any, i) => (
                    <div key={i} className="bento-card p-6">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-[0.15em]">{item.avatarName}</span>
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                            item.priority === 'High' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                            item.priority === 'Medium' ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : 
                            "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          )}>
                            {item.priority}
                          </div>
                       </div>
                       <h5 className="text-[15px] font-bold text-[var(--color-text-primary)] leading-tight mb-2 tracking-tight">{item.title}</h5>
                       <p className="text-[12px] text-[var(--color-text-secondary)] leading-relaxed mb-4">{item.description}</p>
                       <div className="flex items-center justify-between pt-4 border-t border-[var(--color-border-default)]">
                          <span className="text-[9px] font-black text-[var(--color-text-secondary)] uppercase tracking-widest px-2 py-1 bg-[var(--color-slate-elevated)] rounded-md">{item.type}</span>
                          <span className="text-[9px] font-black text-[#0071E3] uppercase tracking-widest uppercase">{item.timeEstimate}</span>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

        </motion.div>

        {/* Mobile Drawer */}
        <div className="lg:hidden">
          <AnimatePresence>
            {isOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={onClose}
                  className="fixed inset-0 bg-black/40 backdrop-blur-md z-[60]"
                />
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className="fixed top-0 left-0 bottom-0 w-[85%] bg-[#FBFBFD] shadow-2xl z-[70] flex flex-col"
                >
                   <div className="p-6 border-b border-[#D2D2D7]/20 flex items-center justify-between text-left">
                      <span className="text-[18px] font-display font-bold">Intelligence Hub</span>
                      <button onClick={onClose}><X size={24} /></button>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      <div className="text-left space-y-4">
                        <h3 className="text-premium-sm">Market Portfolios</h3>
                        {companies.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => { onSelectCompany(c.id); onClose(); }} 
                            className="w-full p-6 bg-[var(--color-card-bg)] rounded-[24px] border border-[var(--color-border-default)] text-left flex items-center justify-between group h-20"
                          >
                             <span className="font-bold text-[var(--color-text-primary)]">{c.name}</span>
                             <ChevronRight size={18} className="text-[var(--color-text-placeholder)] group-hover:translate-x-1 transition-transform" />
                          </button>
                        ))}
                      </div>
                      
                      {allAvatars.length > 0 && (
                        <div className="text-left space-y-4">
                          <h3 className="text-premium-sm">Empathy Models</h3>
                          <div className="grid grid-cols-1 gap-3">
                            {allAvatars.slice(0, 5).map(a => (
                               <div key={a.id} className="p-4 bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border-default)] flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--color-slate-elevated)]">
                                     <img src={a.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${a.id}`} alt="" className="w-full h-full object-cover" />
                                  </div>
                                  <div className="min-w-0">
                                     <div className="text-[14px] font-bold truncate text-[var(--color-text-primary)]">{a.name}</div>
                                     <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-widest">{a.companyName}</div>
                                  </div>
                               </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="p-10 bg-[#0071E3]/5 rounded-[32px] text-center border border-[#0071E3]/10">
                        <Zap size={24} className="text-[#0071E3] mx-auto mb-4" />
                        <p className="text-[13px] text-[#0071E3] font-bold">Switch to desktop for full strategic modeling and Value Hierarchy analysis.</p>
                      </div>
                   </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar Detail Modal */}
        <AnimatePresence>
          {selectedAvatar && (
            <div className={cn(
              "fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500",
              isAvatarMaximized ? "p-0" : "p-4 sm:p-12"
            )}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  setSelectedAvatar(null);
                  setIsAvatarMaximized(false);
                }}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  y: 0,
                  width: isAvatarMaximized ? '100vw' : '100%',
                  height: isAvatarMaximized ? '100vh' : 'auto',
                  maxWidth: isAvatarMaximized ? 'none' : '1100px',
                  maxHeight: isAvatarMaximized ? 'none' : '90vh',
                  borderRadius: isAvatarMaximized ? '0px' : '48px'
                }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full bg-[#FBFBFD] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-card-bg)] sticky top-0 z-10 text-left">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[18px] bg-[#0071E3] text-white flex items-center justify-center shadow-lg shadow-[#0071E3]/20">
                         <Sparkles size={24} />
                      </div>
                      <div>
                         <h4 className="text-[20px] font-bold tracking-tight text-[var(--color-text-primary)]">Intelligence Breakdown</h4>
                         <span className="text-[11px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest block text-left">Persona Modeling: {selectedAvatar.name}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsAvatarMaximized(!isAvatarMaximized)}
                        className="w-12 h-12 bg-[var(--color-slate-elevated)] hover:bg-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-full flex items-center justify-center transition-colors shadow-sm"
                        title={isAvatarMaximized ? "Minimize" : "Full Page"}
                      >
                         {isAvatarMaximized ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAvatar(null);
                          setIsAvatarMaximized(false);
                        }}
                        className="w-12 h-12 bg-[var(--color-slate-elevated)] hover:bg-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-full flex items-center justify-center transition-colors shadow-sm"
                      >
                         <X size={24} />
                      </button>
                   </div>
                </div>
                
                <div className={cn(
                  "flex-1 overflow-y-auto custom-scrollbar scroll-smooth text-left",
                  isAvatarMaximized ? "p-4 sm:p-20" : "p-12"
                )}>
                   <AvatarDeepDiveCard 
                      avatar={selectedAvatar} 
                      company={companies.find(c => c.id === selectedAvatar.companyId)!}
                      offer={offers[selectedAvatar.companyId]!}
                      showOfferOnly={showAvatarOfferOnly}
                      onUpdateAvatar={(updated) => {
                         const company = companies.find(c => (companyProgress[c.id]?.avatars || []).some((a: Avatar) => a.id === updated.id));
                         if (company && onUpdateAvatar) {
                             onUpdateAvatar(company.id, updated);
                             setSelectedAvatar(updated);
                         }
                      }}
                      allAvatars={companies.flatMap(c => companyProgress[c.id]?.avatars || [])}
                      onGenerateSubAvatars={handleGenerateSubAvatars}
                   />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Value Pyramid Modal */}
        <AnimatePresence>
          {showPyramid && (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-12">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPyramid(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                className="relative w-full max-w-[1100px] h-full max-h-[90vh] bg-[#FBFBFD] rounded-[48px] shadow-2xl overflow-hidden flex flex-col"
              >
                <div className="p-8 border-b border-[var(--color-border-default)] flex items-center justify-between bg-[var(--color-card-bg)] sticky top-0 z-10 text-left">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-[18px] bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                         <BarChart3 size={24} />
                      </div>
                      <div>
                         <h4 className="text-[20px] font-bold tracking-tight text-left text-[var(--color-text-primary)]">Market Architecture Analysis</h4>
                         <span className="text-[11px] text-[var(--color-text-secondary)] font-bold uppercase tracking-widest block text-left">Powered by Bain & Co Elements of Value</span>
                      </div>
                   </div>
                   <button
                     onClick={() => setShowPyramid(false)}
                     className="w-12 h-12 bg-[var(--color-slate-elevated)] hover:bg-[var(--color-border-default)] text-[var(--color-text-primary)] rounded-full flex items-center justify-center transition-colors shadow-sm"
                   >
                      <X size={24} />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-12 custom-scrollbar scroll-smooth">
                   <ValuePyramid 
                      avatars={companies.flatMap(c => companyProgress[c.id]?.avatars || [])} 
                      onAvatarClick={(avatar) => {
                        setSelectedAvatar(avatar);
                        setShowPyramid(false);
                      }}
                    />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </>
    )}
  </AnimatePresence>
);
};
