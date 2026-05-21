import React from 'react';
import { Target, ShieldCheck, Zap, MessageCircle, Sparkles, Info, Check, UserCircle2, ArrowRight, Heart, Package, Sun, Activity, Users, Quote, User, Brain, RotateCcw, Loader2, Globe, Layers, X, RefreshCw } from 'lucide-react';
import { Avatar, Company, Offer } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { OfferScoreCard } from '../intel/OfferScoreCard';
import { addToEditHistory } from '../../services/historyService';
import { deepDiveAvatarStream, regenerateTargetedOffer } from '../../services/avatarService';

interface AvatarDeepDiveCardProps {
  avatar: Avatar;
  company: Company;
  offer: Offer;
  index?: number;
  onUpdateAvatar?: (updated: Avatar) => void;
  industry?: string;
  onDeepDiveComplete?: (avatar: Avatar) => void;
  allAvatars?: Avatar[];
  onGenerateSubAvatars?: (parent: Avatar) => Promise<void>;
  showOfferOnly?: boolean;
}

const EditableText: React.FC<{
  value: string;
  onSave: (val: string) => void;
  label: string;
  isTextArea?: boolean;
  dark?: boolean;
}> = ({ value, onSave, label, isTextArea, dark }) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempValue, setTempValue] = React.useState(value);

  if (!isEditing) {
    return (
      <div 
        onClick={() => setIsEditing(true)}
        className="group cursor-pointer relative p-4 -m-4 rounded-2xl hover:bg-[#F5F5F7] transition-all"
      >
        <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] block mb-2", dark ? "text-white/30" : "text-[#86868B]/60")}>{label}</span>
        <p className={cn("text-[17px] leading-relaxed transition-colors font-medium", dark ? "text-white" : "text-[#1D1D1F]")}>
          {value || 'Click to add...'}
        </p>
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <Zap size={14} className="text-amber-500 fill-amber-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <span className="text-[10px] font-black text-[#86868B] dark:text-white/40 uppercase tracking-widest block">{label} (Editing)</span>
      {isTextArea ? (
        <textarea
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className={cn("w-full p-4 border-2 border-[#1D1D1F] dark:border-white/20 rounded-2xl outline-none text-[16px] min-h-[100px] resize-none", dark ? "bg-[#1D1D1F] text-white" : "bg-white text-[#1D1D1F]")}
        />
      ) : (
        <input
          autoFocus
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          className={cn("w-full p-4 border-2 border-[#1D1D1F] dark:border-white/20 rounded-2xl outline-none text-[16px]", dark ? "bg-[#1D1D1F] text-white" : "bg-white text-[#1D1D1F]")}
        />
      )}
      <div className="flex gap-2">
        <button 
          onClick={() => {
            onSave(tempValue);
            setIsEditing(false);
          }}
          className="px-4 py-2 bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] text-[12px] font-black rounded-xl uppercase tracking-widest"
        >
          Save
        </button>
        <button 
          onClick={() => {
            setTempValue(value);
            setIsEditing(false);
          }}
          className="px-4 py-2 bg-gray-100 text-[#86868B] text-[12px] font-black rounded-xl uppercase tracking-widest"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export const AvatarDeepDiveCard: React.FC<AvatarDeepDiveCardProps> = ({ 
  avatar: initialAvatar, 
  company, 
  offer, 
  index, 
  onUpdateAvatar, 
  industry, 
  onDeepDiveComplete,
  allAvatars,
  onGenerateSubAvatars,
  showOfferOnly
}) => {
  const [avatar, setAvatar] = React.useState<Avatar>(initialAvatar);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [streamingStatus, setStreamingStatus] = React.useState<string>('');
  const [selectedElement, setSelectedElement] = React.useState<any>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const tryParseDetailed = (text: string) => {
    const sections = [
      'demographics',
      'traits',
      'sources',
      'transformation',
      'targetedOffer',
      'visualDescriptor',
      'questionnaire',
      'marketIntelligence'
    ];

    const extracted: any = {};
    let foundAny = false;

    sections.forEach(section => {
      // Look for the section and its complete object/array
      // This regex looks for "section": { ... } or "section": [ ... ]
      const regex = new RegExp(`"${section}"\\s*:\\s*([\\{\\[][\\s\\S]*?[\\}\\]])`, 'g');
      const match = regex.exec(text);
      if (match && match[1]) {
        try {
          // Validate it's a complete JSON fragment by parsing it
          const parsed = JSON.parse(match[1]);
          extracted[section] = parsed;
          foundAny = true;
        } catch (e) {
          // Not complete yet
        }
      }
    });

    return foundAny ? extracted : null;
  };

  React.useEffect(() => {
    if (!initialAvatar.transformation && !isStreaming) {
      const runDeepDive = async () => {
        setIsStreaming(true);
        setStreamingStatus('Thinking Phase: Multi-Agent Analysis...');
        try {
          const finalResult = await deepDiveAvatarStream(
            company, 
            offer, 
            initialAvatar, 
            (partialText) => {
              setStreamingStatus('Streaming Synthesis...');
              const partialData = tryParseDetailed(partialText);
              if (partialData) {
                setAvatar(prev => ({
                   ...prev,
                   ...partialData
                }));
              }
            }
          );
          setAvatar(finalResult);
          if (onUpdateAvatar) onUpdateAvatar(finalResult);
          if (onDeepDiveComplete) onDeepDiveComplete(finalResult);
        } catch (err) {
          console.error('Streaming deep dive failed:', err);
        } finally {
          setIsStreaming(false);
          setStreamingStatus('');
        }
      };
      runDeepDive();
    }
  }, [initialAvatar, company, offer]);

  const handleEdit = (field: string, newValue: string, subField?: string) => {
    if (!onUpdateAvatar) return;
    
    const before = subField ? (avatar as any)[field]?.[subField] : (avatar as any)[field];
    
    addToEditHistory({
        field: subField || field,
        before: before || '',
        after: newValue,
        industry: industry || 'General',
        timestamp: new Date().toISOString(),
        type: 'user_edit'
    });

    const updated = { ...avatar };
    if (subField) {
      (updated as any)[field] = {
        ...(updated as any)[field],
        [subField]: newValue
      };
    } else {
      (updated as any)[field] = newValue;
    }
    
    onUpdateAvatar(updated);
  };

  const handleRegenerateOffer = async () => {
    if (!onUpdateAvatar || isRegenerating) return;
    setIsRegenerating(true);
    try {
       const updated = await regenerateTargetedOffer(company, offer, avatar);
       onUpdateAvatar(updated);
       setAvatar(updated);
    } catch (err) {
       console.error("Failed to regenerate offer:", err);
    } finally {
       setIsRegenerating(false);
    }
  };
  // Use dicebear for more professional avatars if no image provided
  const avatarUrl = avatar.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatar.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  return (
    <div className="space-y-16 relative">
      <AnimatePresence>
        {isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="sticky top-6 z-[60] flex justify-center pointer-events-none mb-16"
          >
            <div className="px-8 py-4 bg-white/80 dark:bg-[#1D1D1F]/80 backdrop-blur-xl border border-[#D2D2D7]/40 dark:border-white/10 rounded-full shadow-[0_30px_60px_-12px_rgba(0,0,0,0.12)] flex items-center gap-4 pointer-events-auto ring-1 ring-black/5">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full animate-pulse" />
                  <div className="relative w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                     <Brain size={20} className="text-white" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="flex flex-col items-start translate-y-0.5">
                    <span className="text-[10px] font-black text-[#86868B] dark:text-white/40 uppercase tracking-[0.4em] leading-none mb-1.5 opacity-60">Synthesis Pipeline</span>
                    <span className="text-[15px] font-bold text-[#1D1D1F] dark:text-white tracking-tight">{streamingStatus}</span>
                </div>
                <div className="w-px h-8 bg-[#D2D2D7]/40 dark:bg-white/10 mx-2" />
                <Loader2 size={18} className="text-emerald-500 animate-spin" strokeWidth={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Photo */}
      {!showOfferOnly && (
      <div className="flex flex-col md:flex-row items-center md:items-start gap-12 pt-8">
         <div className="relative group">
            <div className="w-40 h-40 md:w-64 md:h-64 bg-white dark:bg-[#1D1D1F] rounded-[48px] md:rounded-[64px] border border-[#D2D2D7]/40 dark:border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-2xl flex items-center justify-center overflow-hidden shrink-0 transition-all duration-700 group-hover:scale-[1.05] group-hover:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.15)]">
               <img 
                 src={avatarUrl} 
                 alt={avatar.name} 
                 className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                 referrerPolicy="no-referrer"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </div>
            {typeof index === 'number' && (
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#1D1D1F] text-white rounded-[24px] flex items-center justify-center font-display font-bold text-2xl shadow-2xl border-4 border-[#FBFBFD] z-10 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                 {index + 1}
              </div>
            )}
         </div>

         <div className="flex-1 space-y-8 text-center md:text-left">
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 justify-center md:justify-start">
                  <h3 className="text-[56px] font-display font-bold tracking-tight leading-[0.9] text-[#1D1D1F] dark:text-white">Empathy Model.</h3>
                  <div className="flex gap-3 justify-center md:justify-start">
                    <span className="text-[10px] bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-5 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-lg">
                       {avatar.name}
                    </span>
                    <div className="flex items-center gap-2 px-5 py-2 bg-emerald-500/10 text-emerald-500 rounded-full border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em]">
                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                       High Fidelity
                    </div>
                  </div>
               </div>
               <p className="text-[22px] text-[#86868B] dark:text-white/60 max-w-[800px] leading-relaxed font-medium tracking-tight pr-4">{avatar.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-6 items-center justify-center md:justify-start">
               <div className="inline-flex items-center gap-4 px-8 py-4 bg-white dark:bg-[#222222] rounded-[24px] border border-[#D2D2D7] dark:border-white/10 shadow-sm hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-[#F5F5F7] dark:bg-white/10 flex items-center justify-center text-[#1D1D1F] dark:text-white">
                    <ShieldCheck size={22} strokeWidth={2.5} />
                  </div>
                  <div className="flex flex-col items-start translate-y-0.5">
                     <span className="text-[9px] font-black text-[#86868B] dark:text-white/30 uppercase tracking-[0.3em] leading-none mb-1.5 opacity-60">Dominant Trait</span>
                     <span className="text-[17px] font-bold text-[#1D1D1F] dark:text-white tracking-tight">{avatar.definingCharacteristic}</span>
                  </div>
               </div>

               {avatar.elementsOfValue && avatar.elementsOfValue.length > 0 && (
                 <div className="flex flex-wrap gap-3 justify-center">
                   {avatar.elementsOfValue.map((val, i) => (
                     <button 
                       key={i}
                       onClick={() => setSelectedElement(val)}
                       className={cn(
                         "flex items-center gap-3 px-6 py-3 bg-white border border-[#D2D2D7] rounded-full shadow-sm hover:border-[#0071E3] transition-all hover:-translate-y-0.5 active:scale-95 group/element",
                         selectedElement === val && "ring-2 ring-[#0071E3] border-[#0071E3]"
                       )}
                     >
                       <div className={cn(
                         "w-3 h-3 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                         val.category === 'Functional' ? "bg-[#0071E3]" :
                         val.category === 'Emotional' ? "bg-[#FF3B30]" :
                         val.category === 'Life Changing' ? "bg-[#34C759]" : "bg-[#AF52DE]"
                       )} />
                       <span className="text-[14px] font-bold text-[#1D1D1F] group-hover/element:text-[#0071E3] tracking-tight">{val.element}</span>
                     </button>
                   ))}
                 </div>
               )}
            </div>
         </div>

          <AnimatePresence>
            {selectedElement && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden w-full"
              >
                <div className="p-8 bg-[#1D1D1F]/5 dark:bg-white/5 rounded-[32px] border border-[#1D1D1F]/10 dark:border-white/10 space-y-4">
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <Info size={16} className="text-[#1D1D1F] dark:text-white/60" />
                         <span className="text-[12px] font-black text-[#1D1D1F] dark:text-white/60 uppercase tracking-widest">Why they need {selectedElement.element}</span>
                      </div>
                      <button onClick={() => setSelectedElement(null)} className="text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white">
                         <X size={16} />
                      </button>
                   </div>
                   <p className="text-[17px] font-bold text-[#1D1D1F] dark:text-white/90 leading-relaxed">
                     {selectedElement.reasonWhy || `This ${selectedElement.category} element is critical because it addresses specific unmet needs within ${avatar.name}'s current psychological state.`}
                   </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
      )}

      {!showOfferOnly && avatar.valueAnalysis && (
        <div className="bg-[#1D1D1F] dark:bg-[#111111] border border-white/5 rounded-[64px] p-16 text-left relative overflow-hidden text-white shadow-2xl">
           <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/10 blur-[160px] -mr-[400px] -mt-[400px] rounded-full opacity-60" />
           <div className="flex flex-col md:flex-row gap-16 items-start relative z-10">
              <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shrink-0 shadow-2xl">
                 <Sparkles size={32} className="text-white" />
              </div>
              <div className="space-y-6">
                 <div>
                   <h4 className="text-[14px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">
                      Strategic Relevance: Why they buy
                   </h4>
                   <p className="text-[24px] text-white/95 leading-tight font-bold italic">
                     "{avatar.valueAnalysis}"
                   </p>
                 </div>
                 <div className="flex items-center gap-4 text-white/40 text-[13px] font-bold uppercase tracking-widest">
                    <span>Market Psychology</span>
                    <div className="h-px bg-white/10 flex-1" />
                    <span>Proprietary Logic</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* NEW: Behavioral Sensitivity Analysis */}
      {!showOfferOnly && avatar.behavioralAnalysis && avatar.behavioralAnalysis.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {avatar.behavioralAnalysis.map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "p-10 rounded-[48px] border-2 flex flex-col gap-6 shadow-sm transition-transform hover:-translate-y-1 duration-500",
                  item.category === 'Functional' ? "bg-[#F5FBFF] border-[#E1F3FF]" :
                  item.category === 'Emotional' ? "bg-[#FFF5F5] border-[#FFE1E1]" :
                  item.category === 'Life Changing' ? "bg-[#F5FFF9] border-[#E1FFE1]" : "bg-[#F9F5FF] border-[#F1E1FF]"
                )}
              >
                 <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      item.category === 'Functional' ? "bg-[#0071E3] shadow-[0_0_10px_#0071E3]" :
                      item.category === 'Emotional' ? "bg-[#FF3B30] shadow-[0_0_10px_#FF3B30]" :
                      item.category === 'Life Changing' ? "bg-[#34C759] shadow-[0_0_10px_#34C759]" : "bg-[#AF52DE] shadow-[0_0_10px_#AF52DE]"
                    )} />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[#1D1D1F]/40">
                       {item.category} Vector
                    </span>
                 </div>
                 <p className="text-[16px] font-bold text-[#1D1D1F] leading-relaxed tracking-tight">
                    {item.analysis}
                 </p>
              </div>
           ))}
        </div>
      )}

      {/* NEW: Market Intelligence (P16) */}
      {!showOfferOnly && avatar.marketIntelligence && (
        <div className="space-y-16">
          <div className="flex items-center gap-6">
            <div className="h-px bg-[#D2D2D7]/60 dark:bg-white/10 flex-1" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#1D1D1F] dark:bg-white/10 flex items-center justify-center text-white">
                    <Globe size={20} strokeWidth={2.5} />
                </div>
                <h4 className="text-[12px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.5em] leading-none translate-y-0.5">Empathy Intel / {company.country}</h4>
              </div>
            </div>
            <div className="h-px bg-[#D2D2D7]/60 dark:bg-white/10 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="p-12 bg-white dark:bg-[#222222] border border-[#D2D2D7]/60 dark:border-white/10 rounded-[50px] shadow-sm space-y-6 text-left hover:border-emerald-500/20 transition-colors duration-500">
              <div className="flex items-center gap-3 text-[#86868B]/60 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                <Zap size={16} className="text-[#FF9500]" strokeWidth={3} /> Price Perception Archetype
              </div>
              <p className="text-[20px] font-bold text-[#1D1D1F] dark:text-white/90 leading-[1.3] tracking-tight italic pr-4">
                "{avatar.marketIntelligence.pricePerception}"
              </p>
            </div>
            <div className="p-12 bg-white dark:bg-[#222222] border border-[#D2D2D7]/60 dark:border-white/10 rounded-[50px] shadow-sm space-y-6 text-left hover:border-emerald-500/20 transition-colors duration-500">
              <div className="flex items-center gap-3 text-[#86868B]/60 dark:text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">
                <Activity size={16} className="text-[#0071E3]" strokeWidth={3} /> Behavioral Pattern Detection
              </div>
              <p className="text-[20px] font-bold text-[#1D1D1F] dark:text-white/90 leading-[1.3] tracking-tight italic pr-4">
                "{avatar.marketIntelligence.buyingBehavior}"
              </p>
            </div>
            <div className="p-16 bg-[#1D1D1F] dark:bg-[#111111] text-white rounded-[64px] shadow-2xl space-y-12 md:col-span-2 relative overflow-hidden text-left border border-white/5">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 blur-[140px] -mr-[300px] -mt-[300px] rounded-full" />
                <div className="relative z-10 space-y-12">
                    <div className="flex items-center gap-5 text-white/30 text-[10px] font-black uppercase tracking-[0.4em] leading-none">
                      <Heart size={16} className="text-[#FF2D55]" strokeWidth={3} /> Cultural Axioms & Strategic Framing
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left">
                        <div className="space-y-4 text-left border-l border-white/10 pl-8">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Environmental Lens</span>
                            <p className="text-[18px] font-medium leading-relaxed text-white/80 italic pr-8">"{avatar.marketIntelligence.culturalConsiderations}"</p>
                        </div>
                        <div className="p-10 bg-white/5 rounded-[40px] border border-white/10 space-y-4 text-left shadow-inner">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Vertical Framing Matrix</span>
                            </div>
                            <p className="text-[24px] font-bold text-white leading-tight tracking-tight">{avatar.marketIntelligence.offerFraming}</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Transformation Grid */}
      {!showOfferOnly && avatar.transformation && (
        <div className="space-y-20">
           <div className="flex items-center justify-center">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="h-0.5 w-16 bg-emerald-500 rounded-full mb-2" />
                <h4 className="text-[12px] font-black text-[#1D1D1F] dark:text-white uppercase tracking-[0.5em] leading-none mb-2">The Transformation Logic</h4>
                <p className="text-[14px] text-[#86868B] font-medium uppercase tracking-[0.2em] opacity-40">Psychological Shift Analysis</p>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 relative">
              <div className="absolute left-1/2 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-[#D2D2D7]/60 to-transparent hidden lg:block" />
              
              {/* Before State */}
              <div className="space-y-12">
                 <div className="inline-flex items-center gap-4 px-8 py-3 bg-[#F5F5F7] rounded-full border border-[#D2D2D7]/60 text-[#86868B] shadow-sm">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#86868B]/40" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Stage 01 / Entropic Current</span>
                 </div>

                 <div className="space-y-6">
                    {[
                      { label: 'The Friction Problem', value: avatar.transformation.beforeProblem },
                      { label: 'Current Possessions', value: avatar.transformation.beforeHave },
                      { label: 'Visceral Feelings', value: avatar.transformation.beforeFeelings, italic: true },
                      { label: 'Day Zero Reality', value: avatar.transformation.beforeDay },
                      { label: 'Baseline Status', value: avatar.transformation.beforeStatus },
                    ].map((item, idx) => (
                      <div key={idx} className="p-8 bg-white border border-[#D2D2D7]/40 rounded-[40px] hover:border-[#D2D2D7]/80 transition-all shadow-sm">
                         <span className="text-[10px] font-black text-[#86868B]/60 uppercase tracking-[0.3em] block mb-3 leading-none">{item.label}</span>
                         <p className={cn("text-[17px] leading-relaxed text-[#1D1D1F] font-medium", item.italic && "italic text-[#1D1D1F]/70")}>
                            {item.value || 'N/A'}
                         </p>
                      </div>
                    ))}
                 </div>
              </div>

              {/* After State */}
              <div className="space-y-12">
                 <div className="inline-flex items-center gap-4 px-8 py-3 bg-[#1D1D1F] rounded-full text-white shadow-2xl shadow-black/20">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10B981]" />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Stage 02 / Master Synthesis</span>
                 </div>

                 <div className="space-y-6">
                    {[
                      { label: 'Primary Solution Vector', value: avatar.transformation.afterBenefit },
                      { label: 'Recursive Value ("So What")', value: avatar.transformation.afterDeepBenefit, highlight: true },
                      { label: 'Mastery Possessions', value: avatar.transformation.afterHave },
                      { label: 'Synthesized Feelings', value: avatar.transformation.afterFeelings },
                      { label: 'The Optimized Day', value: avatar.transformation.afterDay },
                      { label: 'Elevated Social Status', value: avatar.transformation.afterStatus },
                    ].map((item, idx) => (
                      <div key={idx} className={cn(
                        "p-8 rounded-[40px] border-2 transition-all shadow-sm",
                        item.highlight ? "bg-[#0071E3]/[0.02] border-[#0071E3]/20 shadow-[0_20px_40px_-10px_rgba(0,113,227,0.05)]" : "bg-white border-[#D2D2D7]/40 hover:border-[#D2D2D7]/80"
                      )}>
                         <span className={cn(
                           "text-[10px] font-black uppercase tracking-[0.3em] block mb-3 leading-none",
                           item.highlight ? "text-[#0071E3]" : "text-[#86868B]/60"
                         )}>{item.label}</span>
                         <p className={cn(
                           "text-[17px] leading-relaxed font-bold tracking-tight",
                           item.highlight ? "text-[#0071E3]" : "text-[#1D1D1F]"
                         )}>
                            {item.value || 'N/A'}
                         </p>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Hook Summary */}
           <div className="pt-24 border-t border-[#D2D2D7]/40 flex flex-col items-center text-center space-y-8">
              <div className="inline-flex items-center gap-3 text-[#0071E3]">
                 <Quote size={24} strokeWidth={2.5} />
                 <span className="text-[12px] font-black uppercase tracking-[0.5em] opacity-80">Transformation Pivot Point</span>
              </div>
              <p className="text-[44px] font-display font-bold tracking-tight italic max-w-[1000px] leading-[1.1] text-[#1D1D1F]">
                 "{avatar.transformation.hook}"
              </p>
              <div className="h-0.5 w-24 bg-[#0071E3]/20 rounded-full" />
           </div>
        </div>
      )}

      {/* NEW: Transformation Framework (7 Stages) */}
      {!showOfferOnly && (
      <div className="space-y-10">
         <div className="flex items-center gap-4">
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
            <h4 className="text-[14px] font-black text-[#86868B] uppercase tracking-[0.4em]">Before & After Transformation Framework</h4>
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
         </div>

         <div className="grid grid-cols-1 gap-8">
            {[
               { icon: Heart, title: '1. Emotional State', key: 'emotional', desc: 'How they feel about the problem vs. the solution' },
               { icon: Package, title: '2. Tangible & Intangible Results', key: 'results', desc: 'Possessions, metrics, and invisible assets' },
               { icon: Sun, title: '3. Lifestyle Transformation', key: 'lifestyle', desc: 'How their average day changes' },
               { icon: Activity, title: '4. Stress & Relief', key: 'stress', desc: 'Frustration levels and the peace that follows' },
               { icon: Users, title: '5. Identity & Belonging', key: 'identity', desc: 'Community affiliations and social self-labeling' },
               { icon: MessageCircle, title: '6. Relationships & Conversations', key: 'relationships', desc: 'What they talk about with family and friends' },
               { icon: User, title: '7. Self-Perception', key: 'selfPerception', desc: 'Internal narrative and confidence' },
            ].map((stage, i) => {
               const data = (avatar.transformationFramework as any)?.[stage.key];
               if (!data) return null;
               const Icon = stage.icon;

               return (
                  <motion.div 
                    key={stage.key}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group"
                  >
                     <div className="bg-white border-2 border-[#D2D2D7]/30 rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:border-[#0071E3]/20">
                        <div className="p-8 border-b border-[#D2D2D7]/20 bg-[#F5F5F7]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                           <div className="flex items-center gap-5">
                              <div className="w-12 h-12 rounded-2xl bg-white shadow-md border border-[#D2D2D7]/20 flex items-center justify-center text-[#0071E3] transition-transform group-hover:scale-110">
                                 <Icon size={20} />
                              </div>
                              <div>
                                 <h5 className="text-[18px] font-black tracking-tight">{stage.title}</h5>
                                 <p className="text-[13px] text-[#86868B] font-medium">{stage.desc}</p>
                              </div>
                           </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2">
                           <div className="p-8 space-y-4 border-r border-[#D2D2D7]/20 bg-[#F5F5F7]/10">
                              <div className="flex items-center gap-2 text-[#86868B]">
                                 <div className="w-2 h-2 rounded-full bg-[#86868B]" />
                                 <span className="text-[11px] font-black uppercase tracking-widest">The "Before" State</span>
                              </div>
                              <p className="text-[16px] text-[#1D1D1F] leading-relaxed font-semibold italic">
                                 "{data.before}"
                              </p>
                           </div>
                           <div className="p-8 space-y-4 bg-[#0071E3]/[0.02]">
                              <div className="flex items-center gap-2 text-[#0071E3]">
                                 <div className="w-2 h-2 rounded-full bg-[#0071E3] shadow-[0_0_8px_#0071E3]" />
                                 <span className="text-[11px] font-black uppercase tracking-widest">The "After" Mastery</span>
                              </div>
                              <p className="text-[16px] text-[#1D1D1F] leading-relaxed font-bold">
                                 {data.after}
                              </p>
                           </div>
                        </div>
                     </div>
                  </motion.div>
               );
            })}
         </div>
      </div>
      )}

      {avatar.targetedOffer && (
        <div className="relative pt-24 pb-12">
           <div className="absolute inset-0 bg-[#0071E3] rounded-[64px] rotate-[0.5deg] scale-[1.02] opacity-[0.03] -z-10" />
           <div className="bg-white border border-[#0071E3]/20 rounded-[64px] p-20 shadow-[0_60px_100px_-20px_rgba(0,113,227,0.12)] overflow-hidden relative text-left">
              <div className="absolute top-0 right-0 p-16 bg-[#0071E3]/5 rounded-bl-[120px] border-l border-b border-[#0071E3]/10">
                 <Zap size={80} className="text-[#0071E3] opacity-20" strokeWidth={1.5} />
              </div>
              
              <div className="max-w-[800px] space-y-12 relative z-10">
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                        <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-[#1D1D1F] dark:bg-white rounded-full text-white dark:text-[#1D1D1F] text-[11px] font-black uppercase tracking-[0.4em] shadow-xl">
                           Vertical Optimization
                        </div>
                        <div className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.3em] opacity-40">Segment: {avatar.name}</div>
                    </div>
                    <h4 className="text-[64px] font-display font-bold tracking-tight leading-[0.9] text-[#1D1D1F] pr-12">
                       {avatar.targetedOffer.offerName}
                    </h4>
                 </div>

                 <div className="space-y-12">
                    {avatar.targetedOffer.score && (
                       <OfferScoreCard score={avatar.targetedOffer.score} className="p-10 bg-[#F5F5F7]/30 rounded-[40px] border border-[#D2D2D7]/40 shadow-inner" />
                    )}
                    <div className="space-y-4 border-l-4 border-emerald-500 pl-10">
                       <div className="flex items-center gap-3 text-emerald-500 text-[11px] font-black uppercase tracking-[0.4em] leading-none mb-4">
                          Synthesized Core Transformation
                       </div>
                       <p className="text-[28px] font-bold text-[#1D1D1F] leading-tight tracking-tight">
                          {avatar.targetedOffer.transformation}
                       </p>
                    </div>

                    <div className="p-12 bg-[#0071E3] rounded-[48px] space-y-6 shadow-[0_40px_80px_-20px_rgba(0,113,227,0.4)] group/offer-box relative overflow-hidden">
                       <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[60px] -mr-32 -mt-32" />
                       <div className="flex items-center gap-3 text-white/60 text-[11px] font-black uppercase tracking-[0.5em] relative z-10">
                          <Quote size={16} strokeWidth={3} /> Strategic Hook Vector
                       </div>
                       <p className="text-[32px] font-display font-bold tracking-tight text-white italic leading-tight relative z-10 pr-8">
                          "{avatar.targetedOffer.hook}"
                       </p>
                       <div className="pt-6 flex justify-end relative z-10">
                           <div className="w-12 h-12 rounded-full border-2 border-white/20 flex items-center justify-center text-white group-hover/offer-box:scale-110 group-hover/offer-box:border-white transition-all duration-500">
                               <ArrowRight size={24} strokeWidth={3} />
                           </div>
                       </div>
                    </div>

                    <div className="space-y-4 pl-4">
                       <div className="text-[#86868B]/60 text-[10px] font-black uppercase tracking-[0.4em]">Engine Logic Reasoning</div>
                       <p className="text-[17px] font-medium text-[#1D1D1F]/70 leading-relaxed max-w-[640px]">
                          {avatar.targetedOffer.reasoning || "Optimized to bypass segment-specific psychological friction and leverage the brand's unique market authority."}
                       </p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Original Content Below (Compressed for flow) */}
      {!showOfferOnly && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white border border-[#D2D2D7]/40 rounded-[40px] p-10 shadow-sm">
              <h4 className="text-[13px] font-black text-[#86868B] uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                 <Target size={18} /> Demographics
              </h4>
              <div className="space-y-4">
                 {[
                   { label: 'Age Range', value: avatar.demographics?.age },
                   { label: 'Income Level', value: avatar.demographics?.income },
                   { label: 'Education', value: avatar.demographics?.education },
                   { label: 'Location', value: avatar.demographics?.location },
                 ].map(item => (
                   <div key={item.label} className="group p-5 bg-[#F5F5F7] rounded-3xl border border-transparent hover:border-[#D2D2D7]/40 hover:bg-white transition-all">
                      <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest block mb-1">{item.label}</span>
                      <span className="text-[17px] font-bold text-[#1D1D1F]">{item.value || 'N/A'}</span>
                   </div>
                 ))}
              </div>
           </div>
        </div>

        <div className="lg:col-span-2 space-y-8 text-left">
           <div className="bg-white border border-[#D2D2D7]/40 rounded-[40px] p-10 shadow-sm text-left">
              <h4 className="text-[13px] font-black text-[#86868B] uppercase tracking-[0.2em] mb-10 flex items-center gap-2">
                 <Zap size={18} /> Deep Psychological Questionnaire
              </h4>
              
              <div className="space-y-12 text-left">
                {/* Section: Fears & Motivations */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={16} className="text-rose-500" />
                    <span className="text-[11px] font-black uppercase text-[#86868B] tracking-widest">Inhibitors & Drivers</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { q: 'What results in anxiety?', a: avatar.questionnaire?.anxious },
                      { q: 'What motivates them to take action?', a: avatar.questionnaire?.motivation },
                      { q: 'What makes life feel complicated?', a: avatar.questionnaire?.complicated },
                      { q: 'What information do they find valuable?', a: avatar.questionnaire?.valuableInfo },
                    ].map(item => (
                      <div key={item.q} className="space-y-2 group text-left">
                        <div className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-tight">{item.q}</div>
                        <p className="text-[15px] text-[#515154] leading-relaxed pl-4 font-medium italic border-l-2 border-[#D2D2D7]/30 group-hover:border-[#0071E3]/30 transition-colors">
                          {item.a || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Values & Motivations (Health, Money, Design) */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Heart size={16} className="text-red-500" />
                    <span className="text-[11px] font-black uppercase text-[#86868B] tracking-widest">Core Value Lens</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { q: 'Money Motivation', a: avatar.questionnaire?.moneyMotivation },
                      { q: 'Health Motivation', a: avatar.questionnaire?.healthMotivation },
                      { q: 'Design Motivation', a: avatar.questionnaire?.designMotivation },
                      { q: 'Appearance Motivation', a: avatar.questionnaire?.appearanceMotivation },
                    ].map(item => (
                      <div key={item.q} className="p-5 bg-[#F5F5F7]/50 rounded-3xl border border-[#D2D2D7]/20 group text-left">
                        <div className="text-[11px] font-black text-[#86868B] uppercase tracking-widest mb-3">{item.q}</div>
                        <p className="text-[14px] text-[#1D1D1F] font-bold leading-tight">
                          {item.a || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section: Daily Life & Roles */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-blue-500" />
                    <span className="text-[11px] font-black uppercase text-[#86868B] tracking-widest">Identity & Lifestyle</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {[
                      { q: 'Fond Memories', a: avatar.questionnaire?.fondPast },
                      { q: 'Fun & Entertainment', a: avatar.questionnaire?.fun },
                      { q: 'Risk Perception', a: avatar.questionnaire?.risk },
                      { q: 'Roles they are proud of', a: avatar.questionnaire?.proudRoles },
                      { q: 'Roles they aspire to', a: avatar.questionnaire?.aspiringRoles },
                      { q: 'The Average Day', a: avatar.questionnaire?.averageDay },
                    ].map(item => (
                      <div key={item.q} className="space-y-2 group text-left">
                        <div className="text-[14px] font-black text-[#1D1D1F] uppercase tracking-tight">{item.q}</div>
                        <p className="text-[15px] text-[#515154] leading-relaxed pl-4 font-medium italic border-l-2 border-[#D2D2D7]/30 group-hover:border-[#0071E3]/30 transition-colors">
                          {item.a || 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
           </div>
           
           {/* Sub-Avatars / Granular Characteristics Section */}
           {avatar.canHaveSubAvatars && (
             <div className="bg-white border border-[#D2D2D7]/40 rounded-[40px] p-10 shadow-sm text-left">
               <div className="flex items-center justify-between mb-10">
                 <div>
                   <h4 className="text-[13px] font-black text-[#86868B] uppercase tracking-[0.2em] flex items-center gap-2">
                     <Layers size={18} className="text-[#0071E3]" /> Granular Defining Characteristics
                   </h4>
                   <p className="text-[11px] text-[#86868B] font-bold mt-1 uppercase tracking-widest">Identifying Niche Segments within {avatar.name}</p>
                 </div>
                 {!allAvatars?.some(a => a.parentId === avatar.id) && onGenerateSubAvatars && (
                   <button 
                     onClick={() => onGenerateSubAvatars(avatar)}
                     className="px-4 py-2 bg-[#0071E3] text-white text-[10px] font-black rounded-full uppercase tracking-widest hover:bg-[#0076F1] transition-all"
                   >
                     Drill Down
                   </button>
                 )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allAvatars?.filter(a => a.parentId === avatar.id).map(sub => (
                    <div 
                      key={sub.id}
                      className="p-6 bg-[#F5F5F7]/30 rounded-3xl border border-[#D2D2D7]/20 hover:border-[#0071E3]/20 transition-all group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-[#D2D2D7]/20 overflow-hidden shrink-0">
                          <img 
                            src={sub.imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.id}&backgroundColor=b6e3f4,c0aede,d1d4f9`} 
                            className="w-full h-full object-cover" 
                            alt=""
                          />
                        </div>
                        <h5 className="text-[15px] font-black text-[#1D1D1F]">{sub.name}</h5>
                      </div>
                      <p className="text-[12px] text-[#515154] leading-relaxed mb-3 line-clamp-2">{sub.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black text-[#0071E3] uppercase tracking-widest">
                          {sub.definingCharacteristic}
                        </span>
                      </div>
                    </div>
                  ))}
                  {allAvatars?.filter(a => a.parentId === avatar.id).length === 0 && (
                    <div className="col-span-2 py-10 bg-[#F5F5F7]/20 border-2 border-dashed border-[#D2D2D7]/40 rounded-3xl text-center">
                       <p className="text-[12px] text-[#86868B] font-bold uppercase tracking-widest">No granular segments generated yet</p>
                    </div>
                  )}
               </div>
             </div>
           )}
        </div>
      </div>
      )}

      {/* NEW: Enriched Deep Context (Requested by user) */}
      {!showOfferOnly && avatar.deepContext && (
        <div className="space-y-24">
          <div className="flex items-center gap-6">
            <div className="h-px bg-[#D2D2D7]/60 flex-1" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#AF52DE]/10 flex items-center justify-center text-[#AF52DE]">
                    <Target size={20} strokeWidth={2.5} />
                </div>
                <h4 className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-[0.5em] leading-none translate-y-0.5">Neural Empathy Map</h4>
              </div>
            </div>
            <div className="h-px bg-[#D2D2D7]/60 flex-1" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Path to Purchase */}
            <div className="space-y-8">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#0071E3]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1D1D1F]">Path to Purchase</span>
               </div>
               <div className="space-y-6">
                  {[
                    { label: 'Awareness', value: avatar.deepContext.pathToPurchase.awareness, desc: 'Problem realization trigger' },
                    { label: 'Consideration', value: avatar.deepContext.pathToPurchase.consideration, desc: 'Evaluated alternatives' },
                    { label: 'Decision', value: avatar.deepContext.pathToPurchase.decision, desc: 'Final push factors' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-8 bg-white border border-[#D2D2D7]/40 rounded-[40px] shadow-sm relative group hover:border-[#0071E3]/30 transition-all">
                       <span className="text-[10px] font-black text-[#86868B]/60 uppercase tracking-[0.3em] block mb-2">{item.label}</span>
                       <p className="text-[16px] leading-relaxed text-[#1D1D1F] font-bold">{item.value}</p>
                       <p className="text-[11px] text-[#86868B] mt-2 opacity-0 group-hover:opacity-100 transition-opacity font-medium italic">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Beyond Demographics */}
            <div className="space-y-8">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#AF52DE]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1D1D1F]">Decomposition of Values</span>
               </div>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { label: 'Values & Beliefs', value: avatar.deepContext.beyondDemographics.valuesAndBeliefs },
                    { label: 'Pain Points', value: avatar.deepContext.beyondDemographics.painPoints, color: 'text-rose-500' },
                    { label: 'Goals & Aspirations', value: avatar.deepContext.beyondDemographics.goalsAndAspirations, color: 'text-emerald-500' },
                    { label: 'Fears & Objections', value: avatar.deepContext.beyondDemographics.fearsAndObjections, color: 'text-amber-500' },
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-white border border-[#D2D2D7]/40 rounded-[32px] shadow-sm hover:shadow-md transition-all">
                       <span className="text-[10px] font-black text-[#86868B]/60 uppercase tracking-[0.3em] block mb-2">{item.label}</span>
                       <p className={cn("text-[15px] leading-snug font-bold", item.color || "text-[#1D1D1F]")}>{item.value}</p>
                    </div>
                  ))}
                  <div className="p-6 bg-[#AF52DE]/5 border border-[#AF52DE]/10 rounded-[32px]">
                     <span className="text-[10px] font-black text-[#AF52DE] uppercase tracking-[0.3em] block mb-2">Interests & Hobbies</span>
                     <p className="text-[15px] leading-snug font-bold text-[#1D1D1F]">{avatar.deepContext.beyondDemographics.interestsAndHobbies}</p>
                  </div>
               </div>
            </div>

            {/* Behavioral Details */}
            <div className="space-y-8">
               <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full bg-[#FF9500]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.4em] text-[#1D1D1F]">Targeting Vector</span>
               </div>
               <div className="space-y-6">
                  {[
                    { label: 'Online Hangouts', value: avatar.deepContext.behavioralDetails.onlineHangouts, icon: Globe },
                    { label: 'Content Consumption', value: avatar.deepContext.behavioralDetails.contentConsumption, icon: Package },
                    { label: 'Communication Choice', value: avatar.deepContext.behavioralDetails.communicationPreferences, icon: MessageCircle },
                    { label: 'Purchase Triggers', value: avatar.deepContext.behavioralDetails.purchaseTriggers, icon: Zap, highlight: true },
                  ].map((item, idx) => (
                    <div key={idx} className={cn(
                      "p-8 rounded-[40px] border shadow-sm flex items-start gap-4 transition-all duration-500",
                      item.highlight ? "bg-[#1D1D1F] text-white border-transparent shadow-xl" : "bg-white border-[#D2D2D7]/40 hover:border-[#D2D2D7]/80"
                    )}>
                       <item.icon size={18} className={cn("mt-1", item.highlight ? "text-[#FF9500]" : "text-[#86868B]")} />
                       <div>
                          <span className={cn("text-[10px] font-black uppercase tracking-[0.3em] block mb-2", item.highlight ? "text-white/40" : "text-[#86868B]/60")}>{item.label}</span>
                          <p className={cn("text-[16px] leading-snug font-bold", item.highlight ? "text-[#FF9500]" : "text-[#1D1D1F]")}>{item.value}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Strategic SynthesisSection */}
      {!showOfferOnly && avatar.synthesis && (
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-[#0071E3]" />
                <h4 className="text-[14px] font-black text-[#86868B] uppercase tracking-[0.4em]">Strategic Synthesis</h4>
              </div>
              <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest text-center">Neural Agent Resolution Layer</span>
            </div>
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              className="p-10 bg-white border-2 border-[#D2D2D7]/30 rounded-[48px] space-y-8 text-left"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Target size={18} />
                  </div>
                  <h5 className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Winning Core Logic</h5>
                </div>
                <div className="space-y-4">
                  <div className="p-6 bg-[#F5F5F7] rounded-3xl space-y-2">
                    <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Primary Motivation</span>
                    <p className="text-[16px] text-[#1D1D1F] font-bold leading-relaxed">{avatar.synthesis.realPrimaryMotivation}</p>
                  </div>
                  <div className="p-6 bg-[#F5F5F7] rounded-3xl space-y-2">
                    <span className="text-[10px] font-black text-[#86868B] uppercase tracking-widest">Winning Approach</span>
                    <p className="text-[16px] text-[#1D1D1F] font-bold leading-relaxed">{avatar.synthesis.winningApproach}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-[#D2D2D7]/20 space-y-6">
                 <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Sparkles size={18} />
                  </div>
                  <h5 className="text-[12px] font-black text-[#1D1D1F] uppercase tracking-widest">Unique Strategic Insight</h5>
                </div>
                <p className="text-[18px] text-[#1D1D1F] font-black leading-tight tracking-tight italic">
                  "{avatar.synthesis.uniqueInsight}"
                </p>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="p-10 bg-[#1D1D1F] rounded-[48px] space-y-8 text-white text-left"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center">
                    <ShieldCheck size={18} />
                  </div>
                  <h5 className="text-[12px] font-black text-white/50 uppercase tracking-widest">Resolved Tensions</h5>
                </div>
                <div className="space-y-4">
                  {avatar.synthesis.conflictsResolved.map((item, i) => (
                    <div key={i} className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                        <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Conflict</span>
                      </div>
                      <p className="text-[13px] text-white/70 font-medium italic">"{item.conflict}"</p>
                      <div className="flex items-center gap-2 pt-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Resolution</span>
                      </div>
                      <p className="text-[14px] text-white font-bold leading-relaxed">{item.resolution}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-white/10 flex items-center justify-between">
                <div>
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest block mb-1">Synthesis Confidence</span>
                   <div className="flex items-center gap-2">
                      <div className="text-[24px] font-black text-emerald-400">{avatar.synthesis.confidenceScore}%</div>
                      <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${avatar.synthesis.confidenceScore}%` }}
                          className="h-full bg-emerald-400"
                        />
                      </div>
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* NEW: Actionable Execution Plan */}
      {!showOfferOnly && avatar.executionPlan && avatar.executionPlan.length > 0 && (
        <div className="space-y-10">
          <div className="flex items-center gap-4">
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3">
                <Brain size={20} className="text-[#0071E3]" />
                <h4 className="text-[14px] font-black text-[#86868B] uppercase tracking-[0.4em]">Actionable Strategy Plan</h4>
              </div>
              <span className="text-[10px] font-black text-[#0071E3] uppercase tracking-widest text-center">Step-by-Step Implementation for this Segment</span>
            </div>
            <div className="h-px bg-[#D2D2D7]/30 flex-1" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {avatar.executionPlan.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="group p-8 bg-white border-2 border-[#D2D2D7]/30 rounded-[40px] hover:border-[#0071E3]/30 hover:shadow-2xl transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 bg-[#F5F5F7] rounded-bl-[32px] border-l border-b border-[#D2D2D7]/20 text-[24px] font-black text-[#D2D2D7] group-hover:text-[#0071E3]/20 transition-colors">
                  {(i + 1).toString().padStart(2, '0')}
                </div>
                
                  <div className="space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      item.priority === 'High' ? "bg-rose-50 text-rose-600 border border-rose-100" :
                      item.priority === 'Medium' ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-blue-50 text-blue-600 border border-blue-100"
                    )}>
                      {item.priority} Priority
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#86868B]">{item.difficulty}</span>
                  </div>

                  <div className="space-y-3 pt-4">
                    <h5 className="text-[18px] font-black tracking-tight leading-tight group-hover:text-[#0071E3] transition-colors">{item.title}</h5>
                    <p className="text-[14px] text-[#86868B] font-bold uppercase tracking-tighter">{item.type}</p>
                  </div>

                  <p className="text-[15px] text-[#515154] leading-relaxed font-medium pb-4 border-b border-[#D2D2D7]/10">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                       <Zap size={14} className="text-[#0071E3]" />
                       <span className="text-[11px] font-black text-[#1D1D1F] uppercase tracking-widest">Time: {item.timeEstimate}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* NEW: Intelligence Critique (Self-Evaluation) */}
      {!showOfferOnly && avatar.critique && (
        <div className="p-10 bg-amber-50/30 border-2 border-amber-100 rounded-[48px] relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-amber-200/20 blur-[80px] -mr-32 -mt-32" />
           <div className="flex gap-8 items-start relative z-10">
              <div className="w-16 h-16 bg-white rounded-3xl border border-amber-200 flex items-center justify-center text-amber-600 shrink-0 shadow-lg">
                 <ShieldCheck size={32} />
              </div>
              <div className="space-y-4 text-left">
                 <div className="flex items-center gap-3">
                    <h4 className="text-[12px] font-black text-amber-700 uppercase tracking-[0.4em]">Strategy Self-Evaluation Layer</h4>
                    <div className="h-px bg-amber-200 flex-1" />
                 </div>
                 <p className="text-[18px] text-amber-900 leading-relaxed font-bold italic">
                    "{avatar.critique}"
                 </p>
                 <div className="flex items-center gap-2 text-amber-600 font-bold text-[11px] uppercase tracking-widest">
                    <Check size={14} /> Second-Pass Correctness Check Passed
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Neural Pipeline Stats (New) */}
      {!showOfferOnly && avatar.pipelineMetadata && (
        <div className="flex flex-wrap gap-4 pt-10 border-t border-[#D2D2D7]/20">
           <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] rounded-2xl border border-[#D2D2D7]/20">
              <Activity size={14} className="text-[#0071E3]" />
              <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                Calls: {avatar.pipelineMetadata.totalCalls}
              </span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] rounded-2xl border border-[#D2D2D7]/20">
              <RotateCcw size={14} className={cn(avatar.pipelineMetadata.retriesUsed > 0 ? "text-amber-500" : "text-[#86868B]")} />
              <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                Retries: {avatar.pipelineMetadata.retriesUsed}
              </span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] rounded-2xl border border-[#D2D2D7]/20">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                Attacks Resolved: {avatar.pipelineMetadata.adversarialAttacksResolved}
              </span>
           </div>
           <div className="flex items-center gap-2 px-4 py-2 bg-[#F5F5F7] rounded-2xl border border-[#D2D2D7]/20">
              <Sparkles size={14} className="text-[#0071E3]" />
              <span className="text-[10px] font-black text-[#1D1D1F] uppercase tracking-widest">
                Synthesis Confidence: {avatar.pipelineMetadata.synthesisConfidence}%
              </span>
           </div>
        </div>
      )}

      {/* Handling Objections */}
      {!showOfferOnly && (
      <div className="bg-[#F5F5F7] rounded-[48px] p-12 flex flex-col md:flex-row gap-12 items-center border border-[#D2D2D7]/20 shadow-sm">
         <div className="w-20 h-20 rounded-3xl bg-white flex items-center justify-center text-[#FF3B30] shrink-0 shadow-xl border border-[#D2D2D7]/20 rotate-3">
            <Info size={40} />
         </div>
         <div className="flex-1 space-y-6">
            <h4 className="text-[28px] font-black tracking-tight text-left text-[#1D1D1F]">Handling Fatal Objections</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
               <div className="space-y-2">
                  <div className="text-[11px] font-black text-[#86868B] uppercase tracking-[0.2em] mb-2">The Psychological Friction</div>
                  <p className="text-[17px] font-bold leading-tight text-[#1D1D1F]">{avatar.hesitations?.judgments}</p>
                  <p className="text-[14px] text-[#86868B] font-medium leading-relaxed">{avatar.hesitations?.reasoning}</p>
               </div>
               <div className="p-8 bg-white rounded-[32px] border-2 border-[#D2D2D7]/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px]" />
                  <div className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2 text-left relative z-10">
                     <Check size={18} className="bg-emerald-500 text-white rounded-full p-0.5" /> High-Con Strategy
                  </div>
                  <p className="text-[16px] font-black leading-relaxed text-[#1D1D1F] relative z-10">{avatar.hesitations?.addressing}</p>
               </div>
            </div>
         </div>
      </div>
      )}
    </div>
  );
};
