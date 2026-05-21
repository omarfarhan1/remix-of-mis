import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Rocket, Globe, Users, Zap, Shield, ChevronRight, ArrowRight } from 'lucide-react';
import { Company, Offer, Avatar } from '../../types';
import { cn } from '../../lib/utils';
import { DotNav } from '../DotNav';

interface StrategicScalingProps {
  company: Company;
  offer: Offer;
  avatars: Avatar[];
  onComplete: () => void;
}

export const StrategicScaling: React.FC<StrategicScalingProps> = ({ company, offer, avatars, onComplete }) => {
  const [activePlan, setActivePlan] = React.useState<'domestic' | 'global' | 'enterprise'>('domestic');

  const plans = [
    {
      id: 'domestic',
      title: 'Market Dominance',
      description: 'Solidify your position in your primary country through hyper-segmented copy and aggressive channel expansion.',
      icon: <Shield className="text-[#0071E3]" />,
      metrics: ['+45% Conversion Resonance', '2.4x Channel Efficiency']
    },
    {
      id: 'global',
      title: 'Global Expansion',
      description: 'Port your highest-performing avatar hooks across border cultural lines using our localization empathy engine.',
      icon: <Globe className="text-[#A259FF]" />,
      metrics: ['Multi-currency Resonance', 'Cultural Adaptation Layers']
    },
    {
      id: 'enterprise',
      title: 'Vertical Authority',
      description: 'Move up-market by reframing your core product for high-ticket decision makers and institutional buyers.',
      icon: <Rocket className="text-[#FF9500]" />,
      metrics: ['6-Figure Transformation', 'Stakeholder Conflict Resolution']
    }
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-24 animate-fade-in font-sans text-[#1D1D1F]">
      <div className="mb-20">
        <DotNav 
            totalSteps={4} 
            currentStep={4} 
            stepName="SCALE ENGINE" 
            onStepClick={() => {}}
            isStageComplete={true} 
        />
      </div>

      <div className="text-center mb-24 space-y-8">
        <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#0071E3]/5 text-[#0071E3] rounded-full text-[12px] font-black uppercase tracking-[0.2em] mb-4">
            <Zap size={14} /> Intelligence Synthesis Complete
        </div>
        <h2 className="text-[64px] font-display font-bold tracking-tight leading-[0.9] bg-gradient-to-b from-[#1D1D1F] to-[#86868B] bg-clip-text text-transparent">
          Initiate Scale Protocol.
        </h2>
        <p className="text-[21px] text-[#86868B] font-medium max-w-[700px] mx-auto leading-relaxed">
          Your Strategic Foundation is solid. The data nodes have converged. Select your growth trajectory to generate the final execution blueprints.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-24">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.15, duration: 1, ease: [0.32, 0.72, 0, 1] }}
            onClick={() => setActivePlan(plan.id as any)}
            className={cn(
              "group relative bg-white dark:bg-[#1D1D1F] border rounded-[48px] p-12 transition-all duration-700 cursor-pointer overflow-hidden",
              activePlan === plan.id 
                ? "border-[#0071E3] shadow-[0_60px_100px_-20px_rgba(0,113,227,0.1)] -translate-y-2" 
                : "border-[#D2D2D7] hover:border-[#0071E3]/30 hover:shadow-xl opacity-80"
            )}
          >
            <div className="relative z-20">
              <div className="flex items-start justify-between mb-10">
                <div className={cn(
                    "w-20 h-20 rounded-[28px] flex items-center justify-center transition-all duration-500",
                    activePlan === plan.id ? "bg-[#0071E3] text-white" : "bg-[#F5F5F7] text-[#1D1D1F]"
                )}>
                  {React.cloneElement(plan.icon as any, { size: 40, strokeWidth: 2 })}
                </div>
              </div>

              <h3 className="text-[32px] font-bold mb-6 tracking-tight leading-tight">{plan.title}</h3>
              <p className="text-[18px] text-[#6E6E73] leading-relaxed mb-10 font-medium">
                {plan.description}
              </p>

              <div className="space-y-4 pt-10 border-t border-[#D2D2D7]/20">
                {plan.metrics.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />
                    <span className="text-[13px] font-black uppercase tracking-[0.15em] text-[#86868B]">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="bg-[#0071E3] text-white px-16 py-8 rounded-[32px] text-[19px] font-bold shadow-2xl hover:bg-[#0077ED] transition-all flex items-center gap-4 group"
        >
          Initialize Final Execution <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
        </motion.button>
      </div>

      <div className="mt-40 p-20 bg-[#F5F5F7] dark:bg-[#1D1D1F] rounded-[64px] border border-[#D2D2D7] relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12">
            <Zap className="text-[#0071E3]/20" size={120} />
         </div>
         <div className="max-w-[800px] relative z-10">
            <h4 className="text-[24px] font-bold mb-8">Strategic Intelligence Hub: Roadmap</h4>
            <div className="space-y-6">
                {[
                    { t: 'Multi-Channel Synthesis', d: 'Your offer is being mapped to Facebook, LinkedIn, and Google Ads frameworks.' },
                    { t: 'Cold Outreach Engine', d: 'Drafting segment-specific B2B outreach sequences based on the "Deep Pain" extractions.' },
                    { t: 'Visual Identity Layer', d: 'Generating ad creative concepts for each of your 10 avatars.' }
                ].map((item, i) => (
                    <div key={i} className="flex gap-6 items-start">
                        <div className="w-12 h-12 rounded-full border-2 border-[#0071E3]/20 flex items-center justify-center shrink-0">
                            <span className="text-[14px] font-black text-[#0071E3]">{i + 1}</span>
                        </div>
                        <div>
                            <span className="text-[17px] font-bold block mb-1">{item.t}</span>
                            <p className="text-[15px] text-[#86868B] font-medium leading-relaxed">{item.d}</p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};
