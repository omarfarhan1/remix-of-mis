import React from 'react';

export const GeneratingScreen: React.FC = () => {
  return (
    <div className="max-w-[640px] mx-auto px-4 pt-20 pb-20 text-center">
      <div className="flex justify-center items-center gap-1.5 mb-4 animate-pulse-dots">
        <span className="w-2.5 h-2.5 bg-[var(--color-text-secondary)] rounded-full" />
        <span className="w-2.5 h-2.5 bg-[var(--color-text-secondary)] rounded-full" />
        <span className="w-2.5 h-2.5 bg-[var(--color-text-secondary)] rounded-full" />
      </div>
      <p className="text-[16px] text-[var(--color-text-secondary)]">Crafting your offer...</p>
    </div>
  );
};
