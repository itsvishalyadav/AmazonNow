import { Sparkles, ChevronRight, X } from 'lucide-react';
import type { ProactiveSuggestion } from '../lib/api';

interface ProactiveBannerProps {
  suggestion: ProactiveSuggestion;
  onReview: () => void;
  onDismiss: () => void;
}

export default function ProactiveBanner({ suggestion, onReview, onDismiss }: ProactiveBannerProps) {
  return (
    <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] border border-white/10 shadow-2xl group animate-fadeUp isolate">
      {/* Dynamic ambient glow */}
      <div className="absolute -inset-[100%] opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amazon-orange via-transparent to-transparent group-hover:opacity-30 transition-opacity duration-1000 pointer-events-none -z-10 blur-3xl" />
      
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
        <div className="flex items-start gap-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amazon-orange/30 to-amazon-orange/5 flex items-center justify-center shrink-0 border border-amazon-orange/30 shadow-[inset_0_1px_3px_rgba(255,255,255,0.2)] backdrop-blur-md">
            <Sparkles size={24} className="text-amazon-orange drop-shadow-md" />
          </div>
          <div className="flex flex-col justify-center pt-0.5">
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-base sm:text-lg font-extrabold text-white tracking-tight drop-shadow-sm">{suggestion.signal}</h3>
              <span className="px-2 py-0.5 rounded-md bg-gradient-to-r from-amazon-orange to-yellow-500 text-black text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                Suggested
              </span>
            </div>
            <p className="text-[14px] text-gray-300 leading-snug max-w-lg font-medium opacity-90">
              We've curated a fast-checkout cart of <strong className="text-white">{suggestion.proposal.items.length} items</strong> for this occasion, tailored to your preferences.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full sm:w-auto mt-2 sm:mt-0 sm:pl-0">
          <button 
            onClick={onDismiss}
            className="hidden sm:flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-full transition-all"
            title="Dismiss"
          >
            <X size={20} />
          </button>
          <button 
            onClick={onReview}
            className="flex-1 sm:flex-none flex-shrink-0 whitespace-nowrap relative overflow-hidden flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-100 px-6 py-3 rounded-xl font-bold text-[14px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_20px_rgba(255,255,255,0.15)] group/btn"
          >
            <span className="relative z-10 flex items-center gap-1">
              Review Cart <ChevronRight size={18} className="transition-transform group-hover/btn:translate-x-1" />
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:animate-[shimmer_1s_infinite] skew-x-12" />
          </button>
        </div>
        
        {/* Mobile dismiss button */}
        <button 
          onClick={onDismiss}
          className="sm:hidden absolute top-4 right-4 text-gray-500 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
