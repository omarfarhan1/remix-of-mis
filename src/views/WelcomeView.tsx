import React from 'react';
import { Brain, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { TransitionWrapper } from '../components/TransitionWrapper';

interface Props {
  onStart: () => void;
}

export function WelcomeView({ onStart }: Props) {
  return (
    <TransitionWrapper id="welcome">
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center bg-[var(--color-bg-primary)] dark:bg-[#000000]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="w-32 h-32 mb-12 relative"
        >
          <div className="absolute inset-0 bg-[#0071E3] rounded-[40px] rotate-6 opacity-10 animate-pulse" />
          <div className="absolute inset-0 bg-[#0071E3] rounded-[40px] -rotate-3 opacity-5" />
          <div className="relative w-full h-full bg-[#1D1D1F] dark:bg-[#111111] border border-white/5 rounded-[40px] flex items-center justify-center shadow-2xl shadow-[#1D1D1F]/20">
            <Brain className="text-white" size={48} strokeWidth={1.5} />
          </div>
        </motion.div>

        <div className="space-y-6 max-w-[480px]">
          <h1 className="text-[56px] font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">
            Brand Matrix
          </h1>
          <p className="text-[20px] text-[#86868B] dark:text-[#A1A1A6] font-medium leading-relaxed">
            The definitive workspace for architecting brand authority and segment-specific market strategies.
          </p>
          <div className="pt-8">
            <button onClick={onStart} className="btn-primary px-12 py-4 text-[17px] group">
              Start Building
              <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </TransitionWrapper>
  );
}
