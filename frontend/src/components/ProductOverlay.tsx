import { X, CheckCircle2, AlertCircle, ArrowLeftRight } from 'lucide-react';
import { useEffect } from 'react';
import type { CartItem } from '../lib/types';

interface ProductOverlayProps {
  item: CartItem;
  onClose: () => void;
}

function ConfidencePip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.8 ? 'var(--amazon-success)' :
    value >= 0.6 ? 'var(--amazon-orange)' :
    'var(--amazon-danger)';
  const label = value >= 0.8 ? 'High' : value >= 0.6 ? 'Medium' : 'Low';

  return (
    <div className="confidence-pip" title={`Confidence: ${pct}%`} style={{ marginTop: '4px', marginBottom: '8px' }}>
      <div className="confidence-track">
        <div
          className="confidence-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="confidence-label" style={{ color }}>
        {label} ({pct}%)
      </span>
    </div>
  );
}

export default function ProductOverlay({ item, onClose }: ProductOverlayProps) {
  // Prevent scrolling on body when overlay is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1a1a] w-full sm:w-[480px] max-h-[90vh] sm:rounded-2xl rounded-t-2xl overflow-y-auto shadow-2xl flex flex-col border border-white/10 animate-fadeUp relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/40 backdrop-blur-md rounded-full text-white/90 hover:text-white hover:bg-black/70 transition-colors shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Image Header */}
        <div className="w-full h-72 bg-white relative flex items-center justify-center p-6">
          {item.imageUrl ? (
            <img 
              src={item.imageUrl} 
              alt={item.name} 
              className="w-full h-full object-contain mix-blend-multiply"
            />
          ) : (
            <div className="text-gray-400 text-lg">No Image</div>
          )}
        </div>

        {/* Product Details */}
        <div className="p-6 flex flex-col gap-4">
          
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-white leading-tight">{item.name}</h2>
            
            {/* Amazon Meta */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
              {item.rating && (
                <div className="flex items-center gap-0.5">
                  <span className="text-lg font-bold text-[#FF9900]">{item.rating.toFixed(1)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF9900" xmlns="http://www.w3.org/2000/svg" className="mt-[2px]">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                  </svg>
                  {item.reviewCount && (
                    <span className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline cursor-pointer ml-1">
                      {item.reviewCount.toLocaleString()} ratings
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <span className="text-3xl font-light text-white">₹{item.price}</span>
              {item.isPrime && (
                <span className="text-[#00A8E1] font-extrabold italic text-lg tracking-tight">prime</span>
              )}
            </div>

            {/* Confidence Pip and Description */}
            {item.confidence && (
              <div className="mt-2">
                <ConfidencePip value={item.confidence} />
              </div>
            )}
            
            {item.reason && (
              <p className="text-[13px] text-gray-400 leading-relaxed mt-1">
                {item.reason}
              </p>
            )}
          </div>

          <div className="h-px w-full bg-white/10 my-1" />

          {/* AI Notes section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">AI Agent Notes</h3>
            
            {item.deliveryTime && (
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle2 size={16} className="text-amazon-success mt-0.5 shrink-0" />
                <span>Get it <strong className="text-white">{item.deliveryTime}</strong> via Amazon Now</span>
              </div>
            )}

            {item.dietaryFlag && (
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <AlertCircle size={16} className="text-amazon-danger mt-0.5 shrink-0" />
                <span>Dietary Note: <strong className="text-white">{item.dietaryFlag}</strong></span>
              </div>
            )}
            
            {item.substituteFor && (
              <div className="flex items-start gap-2 text-sm text-gray-300">
                <ArrowLeftRight size={16} className="text-blue-400 mt-0.5 shrink-0" />
                <span>Substituted for: <strong className="text-white">{item.substituteFor}</strong></span>
              </div>
            )}
          </div>

          {/* Got it Button */}
          <button 
            className="w-full py-3.5 mt-4 bg-[#111] text-gray-300 font-bold text-[15px] rounded-full border border-amazon-orange/40 hover:border-amazon-orange hover:text-amazon-orange transition-all shadow-[0_0_15px_rgba(255,153,0,0.1)] hover:shadow-[0_0_20px_rgba(255,153,0,0.2)] group relative overflow-hidden flex items-center justify-center"
            onClick={onClose}
          >
            <div className="absolute inset-0 bg-amazon-orange/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            <span className="relative z-10 group-hover:hidden block">Got it</span>
            <span className="relative z-10 hidden group-hover:block">Close Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
