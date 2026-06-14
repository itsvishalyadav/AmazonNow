import { Plus, RefreshCcw } from 'lucide-react';
import type { CartItem } from '../lib/types';

interface ReorderStripProps {
  candidates: CartItem[];
  onAppendToSearch: (productName: string) => void;
  onClickProduct?: (item: CartItem) => void;
}

export default function ReorderStrip({ candidates, onAppendToSearch, onClickProduct }: ReorderStripProps) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 mt-4 mb-6 animate-fadeUp">
      <div className="flex items-center gap-2 px-1 mb-1">
        <div className="w-6 h-6 rounded-full bg-amazon-orange/20 flex items-center justify-center">
          <RefreshCcw size={12} className="text-amazon-orange" />
        </div>
        <h3 className="text-[14px] font-bold text-white uppercase tracking-widest flex items-center gap-2">
          Running Low?
          <span className="text-[10px] font-medium text-gray-400 normal-case tracking-normal bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
            Based on your history
          </span>
        </h3>
      </div>
      
      {/* Horizontal scrolling container */}
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 snap-x hide-scrollbar">
        {candidates.map((item, idx) => {
          // Extract exactly how many days ago, e.g. "last ordered 4 days ago" -> "4 days"
          const daysMatch = item.reason.match(/last ordered (\d+) days/i);
          const daysAgo = daysMatch ? daysMatch[1] : '?';
          
          return (
            <div 
              key={`${item.productId}-${idx}`}
              className="flex-shrink-0 w-64 bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[20px] overflow-hidden shadow-2xl snap-start flex flex-col group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] hover:border-white/10 relative isolate"
            >
              {/* Subtle hover glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none -z-10" />

              <div className="h-36 relative p-4 flex items-center justify-center bg-black/20">
                <div className="w-24 h-24 bg-white rounded-2xl shadow-inner p-2 flex items-center justify-center group-hover:scale-105 transition-transform duration-500 relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-300 text-xs">
                      No image
                    </div>
                  )}
                </div>
                
                {/* Premium Confidence badge */}
                {item.confidence && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-emerald-500/90 to-emerald-400/90 text-black text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.3)] backdrop-blur-md flex items-center gap-1 border border-emerald-300/30">
                    <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
                    {Math.round(item.confidence * 100)}% Match
                  </div>
                )}

                {/* Days ago badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md border border-white/10 text-white text-[10px] font-medium px-2 py-1 rounded-md shadow-sm">
                  {daysAgo}d ago
                </div>
              </div>
              
              <div 
                className="p-4 flex flex-col flex-1 cursor-pointer"
                onClick={() => onClickProduct?.(item)}
              >
                <h4 className="text-[14px] font-bold text-white leading-snug line-clamp-2 mb-1 group-hover:text-amazon-orange transition-colors" title={item.name}>
                  {item.name}
                </h4>
                
                {/* Amazon-like metadata row */}
                {(item.rating || item.deliveryTime || item.isPrime) && (
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-2">
                    {item.rating && (
                      <div className="flex items-center gap-0.5">
                        <span className="text-[11px] font-bold text-[#FF9900]">{item.rating.toFixed(1)}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#FF9900" xmlns="http://www.w3.org/2000/svg" className="mt-[1px]">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                        </svg>
                        {item.reviewCount && (
                          <span className="text-[10px] text-gray-400 ml-0.5">({item.reviewCount.toLocaleString()})</span>
                        )}
                      </div>
                    )}
                    {item.isPrime && (
                      <div className="flex items-center">
                        <span className="text-[#00A8E1] font-extrabold italic text-[11px] tracking-tight">prime</span>
                      </div>
                    )}
                    {item.deliveryTime && (
                      <span className="text-[10px] font-medium text-gray-300 w-full">
                        Get it <span className="font-bold text-white">{item.deliveryTime}</span>
                      </span>
                    )}
                  </div>
                )}
                
                <p className="text-[11px] text-gray-400 line-clamp-2 flex-1 mb-4 leading-relaxed" title={item.reason}>
                  {item.reason}
                </p>
                
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-gray-500 font-medium">Estimated</span>
                    <span className="text-[16px] font-extrabold text-white">₹{item.price}</span>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onAppendToSearch(item.name);
                    }}
                    className="flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white hover:bg-amazon-orange hover:text-black hover:scale-110 active:scale-95 transition-all shadow-md group/add"
                    aria-label={`Add ${item.name}`}
                  >
                    <Plus size={18} strokeWidth={2.5} className="group-hover/add:rotate-90 transition-transform duration-300" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
