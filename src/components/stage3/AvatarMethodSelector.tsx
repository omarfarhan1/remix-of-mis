import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Brain, MessageSquare, Search, Lock, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DotNav } from '../DotNav';

interface AvatarMethod {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLocked: boolean;
  tag?: string;
}

const METHODS: AvatarMethod[] = [
  {
    id: 'ai',
    title: 'AI Generated',
    description: 'Hyper-realistic persona based on your brand strategy and offer.',
    icon: <Sparkles className="text-[#0071E3]" />,
    isLocked: true,
    tag: 'Recommended'
  },
  {
    id: 'manual',
    title: 'Manual Generated',
    description: 'Build your own avatar step-by-step with expert guidance.',
    icon: <Brain className="text-[#1D1D1F]" />,
    isLocked: true
  },
  {
    id: 'mining',
    title: 'Message Mining',
    description: 'Extract raw desires and pains from reviews and testimonials.',
    icon: <MessageSquare className="text-[#FF3B30]" />,
    isLocked: true,
    tag: 'Deep Data'
  },
  {
    id: 'competitor',
    title: 'Competitor Research',
    description: 'Steal insights from your competitors\' top customer profiles.',
    icon: <Search className="text-[#34C759]" />,
    isLocked: true
  }
];

interface AvatarMethodSelectorProps {
  onSelect: (method: string) => void;
}

export const AvatarMethodSelector: React.FC<AvatarMethodSelectorProps> = ({ onSelect }) => {
  const methods: AvatarMethod[] = [
    {
      id: 'ai',
      title: 'AI Generated',
      description: 'Hyper-realistic persona based on your brand strategy and offer.',
      icon: <Sparkles className="text-[#0071E3]" />,
      isLocked: false,
      tag: 'Recommended'
    },
    {
      id: 'manual',
      title: 'Manual Generated',
      description: 'Build your own avatar step-by-step with expert guidance.',
      icon: <Brain className="text-[#1D1D1F]" />,
      isLocked: false,
      tag: 'Precise'
    },
    {
      id: 'mining',
      title: 'Message Mining',
      description: 'Extract raw desires and pains from reviews and testimonials.',
      icon: <MessageSquare className="text-[#FF3B30]" />,
      isLocked: false,
      tag: 'Deep Data'
    },
    {
      id: 'competitor',
      title: 'Competitor Research',
      description: 'Steal insights from your competitors\' top customer profiles.',
      icon: <Search className="text-[#34C759]" />,
      isLocked: false,
      tag: 'Shadow Mode'
    }
  ];

  return (
    <div className="max-w-[1000px] mx-auto px-6 pt-24 pb-32 animate-fade-in font-sans text-[#1D1D1F]">
      <div className="mb-20">
        <DotNav 
            totalSteps={4} 
            currentStep={1} 
            stepName="AVATAR SYNTHESIS" 
            onStepClick={() => {}}
            isStageComplete={false} 
        />
      </div>

      <div className="text-center mb-24 space-y-6">
        <h2 className="text-[56px] font-display font-bold tracking-tight leading-[0.9]">Select Intelligence.</h2>
        <p className="text-[19px] text-[#86868B] font-medium max-w-[600px] mx-auto leading-relaxed">
          The fidelity of your Ideal Customer Avatar determines the depth of the empathy engine's output. Select your synthesis vector.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {methods.map((method, i) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
                delay: i * 0.1,
                duration: 1.2,
                ease: [0.32, 0.72, 0, 1]
            }}
            onClick={() => !method.isLocked && onSelect(method.id)}
            className={cn(
              "group relative bg-white dark:bg-[#1D1D1F] border border-[#D2D2D7] dark:border-white/10 rounded-[48px] p-12 transition-all duration-700 overflow-hidden",
              method.isLocked 
                ? "opacity-50 grayscale border-transparent bg-[#F5F5F7]/30 dark:bg-white/5" 
                : "hover:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.1)] hover:-translate-y-2 cursor-pointer border-[#D2D2D7] hover:border-[#0071E3]/20 shadow-sm"
            )}
          >
            <div className="relative z-20">
              <div className="flex items-start justify-between mb-10">
                <div className={cn(
                    "w-16 h-16 rounded-[22px] flex items-center justify-center transition-all duration-500",
                    method.isLocked ? "bg-white/50" : "bg-[#F5F5F7] group-hover:bg-[#0071E3] group-hover:text-white"
                )}>
                  {React.cloneElement(method.icon as any, { 
                      size: 32, 
                      strokeWidth: 2,
                      className: cn(
                          "transition-colors duration-500",
                          !method.isLocked && "group-hover:text-white"
                      )
                  })}
                </div>
                {method.tag && (
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full",
                    method.id === 'ai' ? "bg-[#0071E3]/5 text-[#0071E3]" : "bg-[#1D1D1F] text-white"
                  )}>
                    {method.tag}
                  </span>
                )}
              </div>

              <h3 className="text-[28px] font-bold mb-4 tracking-tight leading-tight transition-colors group-hover:text-[#0071E3]">
                {method.title}
              </h3>
              <p className="text-[17px] text-[#6E6E73] dark:text-[#86868B] leading-relaxed mb-12 min-h-[50px] font-medium opacity-90 dark:opacity-100">
                {method.description}
              </p>

              <div className="flex items-center justify-between pt-10 border-t border-[#D2D2D7]/20">
                {method.isLocked ? (
                  <div className="flex items-center gap-3 text-[#86868B] opacity-40">
                    <Lock size={16} strokeWidth={2.5} />
                    <span className="text-[11px] font-black uppercase tracking-[0.3em]">Module Encrypted</span>
                  </div>
                ) : (
                  <span className="text-[14px] font-black uppercase tracking-[0.2em] text-[#0071E3] flex items-center gap-2 group-hover:gap-4 transition-all">
                    Initiate Path <ChevronRight size={18} strokeWidth={3} />
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-32 flex justify-center">
        <div className="text-center group/footer">
            <p className="text-[12px] font-black text-[#86868B] uppercase tracking-[0.3em] mb-6 opacity-40 group-hover/footer:opacity-100 transition-opacity">Module Pipeline Status</p>
            <div className="flex items-center gap-3 justify-center mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3] animate-pulse" />
                <span className="text-[15px] font-bold text-[#1D1D1F]">AI Generation Online</span>
            </div>
            <div className="h-0.5 w-32 bg-[#D2D2D7]/20 rounded-full mx-auto relative overflow-hidden">
                <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-[#0071E3] w-1/2 rounded-full"
                />
            </div>
        </div>
      </div>
    </div>
  );
};
