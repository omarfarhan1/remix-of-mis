import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, 
  description, 
  action,
  className 
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-[var(--color-card-bg)] rounded-[40px] border border-[#D2D2D7]/60 dark:border-[var(--color-border-default)] shadow-[0_8px_40px_rgba(0,0,0,0.04)] dark:shadow-sm ${className}`}
    >
      <div className="w-20 h-20 bg-[#F5F5F7] dark:bg-[var(--color-slate-elevated)] rounded-3xl flex items-center justify-center text-[var(--color-text-secondary)] opacity-100 dark:opacity-40 mb-8">
        <Icon size={40} strokeWidth={1.5} className="opacity-40 dark:opacity-100 text-[var(--color-text-primary)]" />
      </div>
      <h3 className="text-[24px] font-display font-bold text-[var(--color-text-primary)] mb-4 tracking-tight">{title}</h3>
      <p className="text-[17px] text-[var(--color-text-secondary)] max-w-[320px] mb-10 leading-relaxed font-medium">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary"
        >
          {action.label}
        </button>
      )}
    </motion.div>
  );
};
