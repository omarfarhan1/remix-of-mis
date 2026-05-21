import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronLeft, ChevronRight, Sparkles, Check, Copy, Building2, ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { suggestOfferStep } from '../services/strategyService';
import { Company, Offer } from '../types';

import { getOfferSteps } from '../constants/offerSteps';

interface FormulaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  draftOffer: any;
  onUpdateDraft: (key: string, value: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  resultOffer?: string; 
  companyContext?: Company;
}

export const FormulaEditorModal: React.FC<FormulaEditorModalProps> = ({
  isOpen,
  onClose,
  draftOffer,
  onUpdateDraft,
  onGenerate,
  isGenerating,
  resultOffer,
  companyContext
}) => {
  const [copied, setCopied] = React.useState(false);
  const [showResult, setShowResult] = React.useState(false);
  const [showContext, setShowContext] = React.useState(false);
  const [suggestingKey, setSuggestingKey] = React.useState<string | null>(null);
  const [suggestions, setSuggestions] = React.useState<Record<string, string[]>>({});

  const offerSteps = getOfferSteps(companyContext, draftOffer);

  const handleSuggest = async (key: string) => {
    if (!companyContext) return;
    setSuggestingKey(key);
    const results = await suggestOfferStep(key as keyof Offer, companyContext, draftOffer);
    setSuggestions(prev => ({ ...prev, [key]: results }));
    setSuggestingKey(null);
  };

  const selectSuggestion = (key: string, val: string) => {
    onUpdateDraft(key, val);
    setSuggestions(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  React.useEffect(() => {
    if (resultOffer) setShowResult(true);
    else setShowResult(false);
  }, [resultOffer]);

  const handleCopy = () => {
    if (resultOffer) {
      navigator.clipboard.writeText(resultOffer);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[410] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          >
          <div className="p-8 pb-4 flex justify-between items-center bg-white border-b border-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-[var(--color-accent-blue)] flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 className="text-[20px] font-semibold tracking-tight leading-none">
                  {showResult ? "Your New Offer" : "Edit Offer Formula"}
                </h2>
                <p className="text-[13px] text-gray-500 mt-1">
                  {showResult ? "Ready to high-convert" : "Refine your 5-part marketing offer"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 pt-6">
            {!showResult && companyContext && (
                <div className="mb-8 overflow-hidden rounded-2xl border border-blue-50 bg-blue-50/20">
                    <button 
                        onClick={() => setShowContext(!showContext)}
                        className="w-full flex items-center justify-between p-4 bg-blue-50/30 hover:bg-blue-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Building2 size={16} className="text-blue-600" />
                            <span className="text-[13px] font-bold text-blue-600 uppercase tracking-widest">Brand Context Reference</span>
                        </div>
                        <ChevronDown size={18} className={cn("text-blue-600 transition-transform", showContext && "rotate-180")} />
                    </button>
                    <AnimatePresence>
                        {showContext && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="px-5 py-4 space-y-3 bg-white"
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Company</div>
                                        <div className="text-[14px] font-medium text-gray-900">{companyContext.name}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Industry</div>
                                        <div className="text-[14px] font-medium text-gray-900">{companyContext.industry}</div>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Primary USP</div>
                                    <div className="text-[13px] text-gray-600 leading-relaxed italic">"{companyContext.usp}"</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            <AnimatePresence mode="wait">
              {showResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50/50 p-8 rounded-[32px] border-2 border-blue-100 relative group">
                    <p className="text-[18px] text-gray-800 leading-relaxed font-serif">
                      {resultOffer}
                    </p>
                    <button 
                      onClick={handleCopy}
                      className="absolute top-4 right-4 p-3 bg-white rounded-xl shadow-sm border border-blue-100 text-blue-600 hover:scale-110 transition-all active:scale-95"
                    >
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 py-4">
                    <button 
                      onClick={() => setShowResult(false)}
                      className="text-[14px] font-bold text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      Wait, let me tweak the formula again
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-8"
                >
                  {offerSteps.map((s) => (
                    <div key={s.key} className="space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[13px] font-bold text-gray-400 uppercase tracking-widest">
                          {s.name}
                        </label>
                        <button
                          onClick={() => handleSuggest(s.key)}
                          disabled={suggestingKey === s.key}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 uppercase tracking-tight hover:text-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {suggestingKey === s.key ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Sparkles size={12} />
                          )}
                          AI Suggest
                        </button>
                      </div>
                      
                      <div className="bg-gray-50/80 p-4 rounded-xl border border-gray-100 italic mb-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Example</div>
                        <p className="text-[13px] text-gray-600 leading-relaxed">"{s.example}"</p>
                      </div>

                      <div className="relative group">
                        <textarea
                          value={draftOffer[s.key] || ''}
                          onChange={(e) => onUpdateDraft(s.key, e.target.value)}
                          placeholder={s.placeholder}
                          className="w-full h-32 p-5 bg-white border-2 border-gray-100 rounded-[20px] focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 outline-none transition-all text-[16px] leading-relaxed resize-none pr-12"
                        />
                        <div className="absolute top-4 right-4 text-indigo-100 group-focus-within:text-indigo-300 transition-colors">
                          <Sparkles size={20} />
                        </div>
                      </div>

                      {suggestions[s.key] && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {suggestions[s.key].map((suggestion, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectSuggestion(s.key, suggestion)}
                              className="text-left p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 hover:bg-indigo-50 transition-all text-[13px] text-indigo-800"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      <p className="text-[12px] text-gray-400 px-1">{s.description}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-8 pt-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-4">
            <button 
              onClick={() => {
                if (!showResult && confirm("Discard all changes to your offer strategy?")) {
                  onClose();
                } else if (showResult) {
                  onClose();
                }
              }}
              className="px-6 py-3 text-[15px] font-bold text-gray-400 hover:text-gray-900 transition-colors"
            >
              {showResult ? "Close" : "Cancel"}
            </button>
            {!showResult && (
              <button
                onClick={onGenerate}
                disabled={isGenerating || Object.values(draftOffer).some(v => !v)}
                className="btn-primary min-w-[200px] h-12 flex items-center justify-center gap-2 rounded-[18px] text-base"
              >
                {isGenerating ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles size={18} />
                    </motion.div>
                    Generating...
                  </>
                ) : (
                  <>
                    Update & Regenerate
                    <Sparkles size={18} />
                  </>
                )}
              </button>
            )}
            {showResult && (
              <button
                onClick={onClose}
                className="btn-primary px-8 h-12 rounded-[18px]"
              >
                Done
              </button>
            )}
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
};
