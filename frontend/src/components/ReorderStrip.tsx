import { useCart } from '../context/CartContext';
import type { CartItem } from '../lib/types';
import { showToast } from './Toast';

interface ReorderStripProps {
  candidates: CartItem[];
  isLoading?: boolean;
}

export default function ReorderStrip({ candidates, isLoading }: ReorderStripProps) {
  const { addToGlobalCart, setSelectedProduct } = useCart();

  if (!isLoading && (!candidates || candidates.length === 0)) return null;

  const handleAddToCart = (item: CartItem) => {
    addToGlobalCart({ ...item, qty: 1 });
    showToast(`${item.name} added to cart!`);
  };

  return (
    <div className="flex flex-col gap-3 mt-4 mb-8 bg-[var(--amazon-bg)] py-4 rounded-xl px-4">
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-[20px] font-bold text-[var(--amazon-text)] flex items-center gap-2">
          Buy it again, right on time
          <span className="text-[11px] font-bold text-[#007185] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-sm border border-blue-100 flex items-center gap-1">
            <span className="text-lg leading-none">+</span> Predicted for you
          </span>
        </h3>
      </div>
      <p className="text-[13px] text-[var(--amazon-text-dim)] -mt-2 mb-2">Based on how often you reorder — refill before you run out.</p>
      
      {/* Horizontal scrolling container */}
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
        {isLoading ? (
          /* Shimmer Skeleton Cards */
          Array.from({ length: 4 }).map((_, idx) => (
            <div 
              key={`skeleton-${idx}`}
              className="flex-shrink-0 w-[240px] bg-[var(--amazon-card)] border border-[var(--amazon-border)] rounded-lg p-4 flex flex-col"
            >
              <div className="w-full h-24 bg-[var(--amazon-card-hover)] rounded-md animate-pulse mb-4" />
              <div className="h-4 bg-[var(--amazon-border)] rounded w-3/4 mb-2 animate-pulse" />
              <div className="h-3 bg-[var(--amazon-card-hover)] rounded w-1/2 mb-4 animate-pulse" />
              <div className="h-8 bg-[var(--amazon-border)] rounded w-full mt-auto animate-pulse" />
            </div>
          ))
        ) : (
          candidates.map((item, idx) => {
            const daysMatch = item.reason.match(/(?:last ordered|ordered)\s*(?:it|them)?\s*(\d+)\s*day/i);
            const daysAgo = daysMatch ? daysMatch[1] : '3';
            
            return (
              <div 
                key={`${item.productId}-${idx}`}
                className="flex-shrink-0 w-[240px] bg-[var(--amazon-card)] border border-[var(--amazon-border)] rounded-lg p-4 snap-start flex flex-col hover:shadow-[0_2px_5px_0_rgba(213,217,217,.5)] transition-shadow"
              >
                <div 
                  className="relative flex justify-center mb-4 h-[120px] cursor-pointer bg-white rounded-md p-2"
                  onClick={() => setSelectedProduct(item as any)}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">No image</div>
                  )}
                  
                  {/* Due Now Badge */}
                  <div className="absolute top-0 right-0 bg-[var(--amazon-card)] border border-[#007600] text-[#007600] text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Due now
                  </div>
                </div>
                
                <h4 
                  className="text-[14px] font-bold text-[var(--amazon-text)] leading-snug line-clamp-2 mb-1 hover:text-[#C45500] hover:underline cursor-pointer" 
                  title={item.name}
                  onClick={() => setSelectedProduct(item as any)}
                >
                  {item.name}
                </h4>

                {item.rating && item.reviewCount && (
                  <div className="flex items-center gap-1 text-[12px] mb-2">
                    <span className="text-[#C45500]">{'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5 - Math.round(item.rating))}</span>
                    <span className="text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer">({item.reviewCount.toLocaleString()})</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-auto mb-2">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[var(--amazon-text-dim)]">Every {parseInt(daysAgo) - 1} days</span>
                    <span className="text-[11px] text-[var(--amazon-text-dim)]">Last ordered {daysAgo} days ago</span>
                  </div>
                  <span className="text-[18px] font-bold text-[var(--amazon-text)]">₹{item.price}</span>
                </div>
                
                <button 
                  onClick={() => handleAddToCart(item)}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black py-1.5 rounded-full font-medium text-[13px] border border-[#FCD200] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] active:bg-[#F0B800] transition-colors mb-3"
                >
                  Add to cart
                </button>
                
                <div className="flex justify-between items-center px-1">
                  <button className="text-[12px] text-[#007185] hover:text-[#C45500] hover:underline">Skip</button>
                  <button className="text-[12px] text-[#007185] hover:text-[#C45500] hover:underline">Snooze</button>
                  <button className="text-[12px] text-[#007185] hover:text-[#C45500] hover:underline">Remove</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
