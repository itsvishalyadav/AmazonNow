import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import { postCheckout } from '../lib/api';
import { useState } from 'react';

export default function GlobalCart() {
  const { globalCart, globalCartTotal, globalCartCount, removeFromGlobalCart, updateGlobalCartQty, clearGlobalCart, setSelectedProduct } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const handleProceedToBuy = async () => {
    if (globalCart.length === 0) return;
    setIsCheckingOut(true);
    try {
      await postCheckout({ userId: 'user-demo-01', items: globalCart });
      alert('Order Placed Successfully via Global Cart!');
      clearGlobalCart();
    } catch (err) {
      alert('Failed to place order. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (globalCart.length === 0) {
    return (
      <div className="max-w-[1500px] mx-auto px-4 py-8 flex items-start gap-6 bg-[var(--amazon-bg)] min-h-[calc(100vh-120px)]">
        <div className="flex-1 bg-[var(--amazon-card)] p-6 rounded-sm shadow-sm flex items-center gap-6">
          <div className="w-48 h-48 bg-[var(--amazon-card-hover)] rounded-full flex items-center justify-center">
            <ShoppingCart size={80} className="text-[var(--amazon-border)]" />
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-[var(--amazon-text)]">Your Amazon Cart is empty</h2>
            <a href="#" className="text-[#007185] hover:text-[#C45500] hover:underline text-sm">Shop today's deals</a>
          </div>
        </div>
        <div className="w-[300px] bg-[var(--amazon-card)] p-4 rounded-sm shadow-sm hidden lg:block text-[var(--amazon-text)]">
           <div className="text-sm">
             <span className="font-bold">Your recently viewed items</span>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1500px] mx-auto px-2 lg:px-4 py-6 flex flex-col lg:flex-row items-start gap-6 bg-[var(--amazon-bg)] min-h-[calc(100vh-120px)]">
      {/* Left: Shopping Cart List */}
      <div className="flex-1 bg-[var(--amazon-card)] p-5 rounded-sm shadow-sm text-[var(--amazon-text)]">
        <div className="border-b border-[var(--amazon-border)] pb-2 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-[28px] font-normal leading-none mb-1">Shopping Cart</h1>
            <button className="text-[#007185] hover:text-[#C45500] hover:underline text-sm">Deselect all items</button>
          </div>
          <div className="text-sm text-[var(--amazon-text-dim)] hidden sm:block">Price</div>
        </div>

        <div className="flex flex-col gap-4">
          {globalCart.map((item) => (
            <div key={item.productId} className="flex gap-4 border-b border-[var(--amazon-border)] pb-4 last:border-none">
              <div 
                className="w-[120px] shrink-0 cursor-pointer bg-white rounded-md flex items-center justify-center p-1"
                onClick={() => setSelectedProduct(item as any)}
              >
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 rounded-md flex items-center justify-center">
                    <ShoppingCart size={32} className="text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <h3 
                    className="text-[16px] font-medium text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer leading-snug line-clamp-2 pr-4"
                    onClick={() => setSelectedProduct(item as any)}
                  >
                    {item.name}
                  </h3>
                  <div className="font-bold text-[18px] text-[var(--amazon-text)]">₹{item.price.toFixed(2)}</div>
                </div>
                {item.rating && item.reviewCount && (
                  <div className="flex items-center gap-1 mt-0.5 text-[13px]">
                    <span className="text-[#C45500]">{'★'.repeat(Math.round(item.rating))}{'☆'.repeat(5 - Math.round(item.rating))}</span>
                    <span className="text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer">{item.rating}</span>
                    <span className="text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer">({item.reviewCount.toLocaleString()})</span>
                  </div>
                )}
                <div className="text-sm text-[#007600] mt-1">In stock</div>
                <div className="text-xs text-[var(--amazon-text-dim)]">FREE delivery available at checkout</div>
                {item.isPrime && <div className="text-[#00A8E1] font-bold italic text-xs tracking-tight mt-1">prime</div>}
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="bg-[var(--amazon-card-hover)] border border-[var(--amazon-border)] rounded-lg shadow-sm flex items-center overflow-hidden h-[29px]">
                    <button 
                      onClick={() => {
                        if (item.qty > 1) updateGlobalCartQty(item.productId, item.qty - 1);
                        else removeFromGlobalCart(item.productId);
                      }}
                      className="px-3 text-lg font-medium text-[var(--amazon-text)] hover:bg-[var(--amazon-card-hover)] h-full flex items-center justify-center"
                    >
                      −
                    </button>
                    <div className="px-3 bg-[var(--amazon-card)] text-[var(--amazon-text)] h-full flex items-center justify-center font-bold text-sm min-w-[30px] border-x border-[var(--amazon-border)]">
                      {item.qty}
                    </div>
                    <button 
                      onClick={() => updateGlobalCartQty(item.productId, item.qty + 1)}
                      className="px-3 text-lg font-medium text-[var(--amazon-text)] hover:bg-[var(--amazon-card-hover)] h-full flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  <div className="h-[14px] w-px bg-[var(--amazon-border)]"></div>
                  <button 
                    onClick={() => removeFromGlobalCart(item.productId)}
                    className="text-xs text-[#007185] hover:text-[#C45500] hover:underline"
                  >
                    Delete
                  </button>
                  <div className="h-[14px] w-px bg-[var(--amazon-border)]"></div>
                  <button className="text-xs text-[#007185] hover:text-[#C45500] hover:underline">
                    Save for later
                  </button>
                  <div className="h-[14px] w-px bg-[var(--amazon-border)]"></div>
                  <button className="text-xs text-[#007185] hover:text-[#C45500] hover:underline">
                    Share
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2">
          <div className="text-[18px]">
            Subtotal ({globalCartCount} item{globalCartCount !== 1 ? 's' : ''}): <span className="font-bold">₹{globalCartTotal.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Right: Subtotal & Checkout */}
      <div className="w-full lg:w-[300px] flex flex-col gap-4 text-[var(--amazon-text)]">
        <div className="bg-[var(--amazon-card)] p-5 rounded-sm shadow-sm flex flex-col gap-4">
          <div className="flex items-center gap-1 text-[#007600] text-xs">
            <svg viewBox="0 0 512 512" width="16" height="16" fill="currentColor"><path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm113.8 200.5L228.3 355.2c-4.4 4.8-10.6 7.6-17.1 7.6-6.6 0-12.8-2.8-17.2-7.7l-71.1-77.9c-8.9-9.8-8.2-25 1.5-33.9 9.8-8.9 25-8.2 33.9 1.5l53.4 58.5 125-135.5c8.6-9.3 23.6-10 33-1.4 9.4 8.6 10 23.6 1.4 33.1z"/></svg>
            <span className="font-bold">Part of your order qualifies for FREE delivery.</span>
          </div>
          
          <div className="text-[18px]">
            Subtotal ({globalCartCount} item{globalCartCount !== 1 ? 's' : ''}): <span className="font-bold">₹{globalCartTotal.toLocaleString('en-IN')}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="gift" className="w-4 h-4 rounded border-[var(--amazon-border)]" />
            <label htmlFor="gift" className="text-sm">This order contains a gift</label>
          </div>
          
          <button 
            onClick={handleProceedToBuy}
            disabled={isCheckingOut}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black py-2 rounded-lg font-medium shadow-[0_2px_5px_0_rgba(213,217,217,.5)] border border-[#FCD200] active:bg-[#F0B800] transition-colors"
          >
            {isCheckingOut ? 'Processing...' : 'Proceed to Buy'}
          </button>

          <div className="border border-[var(--amazon-border)] rounded-md mt-2 overflow-hidden">
            <button className="w-full bg-[var(--amazon-card-hover)] text-sm text-left px-3 py-2 flex justify-between items-center transition-colors">
              EMI Available <span className="text-[var(--amazon-text-dim)]">▼</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
