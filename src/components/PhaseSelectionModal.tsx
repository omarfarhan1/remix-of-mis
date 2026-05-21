import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Building2, Sparkles, UserCircle2, ChevronRight, Lock, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { Progress } from '../types';

interface PhaseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  progress?: Progress;
  onSelectPhase: (phase: 'company' | 'offer' | 'avatar') => void;
}

const PHASES = [
  { 
    id: 'company', 
    title: 'Brand Profile', 
    icon: Building2, 
    color: 'text-blue-600', 
    bg: 'bg-blue-50',
    description: 'Update your industry, name, and unique selling proposition.',
    disabled: false
  },
  { 
    id: 'offer', 
    title: 'Offer Formula', 
    icon: Sparkles, 
    color: 'text-amber-600', 
    bg: 'bg-amber-50',
    description: 'Refine your 5-part core marketing offer and value logic.',
    disabled: false
  },
  { 
    id: 'avatar', 
    title: 'Customer Avatar', 
    icon: UserCircle2, 
    color: 'text-purple-600', 
    bg: 'bg-purple-50',
    description: 'Deep psychology and behavioral mapping (Coming Soon).',
    disabled: true
  },
] as const;

export const PhaseSelectionModal: React.FC<PhaseSelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  projectName,
  progress,
  onSelectPhase 
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-[20px] font-bold tracking-tight text-gray-900">Refine Project</h2>
                  <p className="text-[13px] text-gray-500 font-medium">{projectName}</p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-3">
                {PHASES.map((phase) => {
                  const Icon = phase.icon;
                  const isLocked = phase.disabled;
                  const complete = phase.id === 'company' ? progress?.stage1Complete : (phase.id === 'offer' ? progress?.stage2Complete : false);

                  return (
                    <button
                      key={phase.id}
                      disabled={isLocked}
                      onClick={() => {
                        onClose();
                        onSelectPhase(phase.id as any);
                      }}
                      className={cn(
                        "w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                        isLocked 
                          ? "bg-gray-50 border-transparent opacity-60 cursor-not-allowed"
                          : "bg-white border-gray-50 hover:border-blue-500 hover:shadow-md active:scale-[0.98]"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                        phase.color === 'text-blue-600' && "bg-blue-50 text-blue-600",
                        phase.color === 'text-amber-600' && "bg-amber-50 text-amber-600",
                        phase.color === 'text-purple-600' && "bg-purple-50 text-purple-600",
                        isLocked && "bg-gray-100 text-gray-400"
                      )}>
                        <Icon size={24} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[15px] text-gray-800">{phase.title}</span>
                          {complete && <Check size={14} className="text-green-500" />}
                          {isLocked && <Lock size={12} className="text-gray-400" />}
                        </div>
                        <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{phase.description}</p>
                      </div>

                      {!isLocked && (
                        <ChevronRight size={18} className="text-gray-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex justify-center">
              <button 
                onClick={onClose}
                className="text-[14px] font-bold text-gray-400 hover:text-gray-900 transition-colors px-8 py-2"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
