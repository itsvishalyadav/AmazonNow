import { useEffect, useState } from 'react';
import { Package, Repeat, Search } from 'lucide-react';
import { getHistory, postCheckout, type HistoryResponse } from '../lib/api';
import { useCart } from '../context/CartContext';

const DEMO_USER_ID = 'user-demo-01';

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<HistoryResponse['orders']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToGlobalCart, setSelectedProduct } = useCart();
  const [activeTab, setActiveTab] = useState<'orders' | 'buy-again' | 'not-shipped'>('orders');

  const handleBuyItAgain = (item: any) => {
    addToGlobalCart({
      productId: item.productId,
      name: item.name,
      qty: 1,
      price: item.price,
      reason: 'Reordered',
      confidence: 1,
      imageUrl: item.imageUrl
    });
    alert('Item added to Global Cart');
  };

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await getHistory(DEMO_USER_ID);
        setOrders(res.orders);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-[1024px] mx-auto p-4 text-center mt-10 text-[var(--amazon-text-dim)]">
        Loading orders...
      </div>
    );
  }

  return (
    <div className="max-w-[1024px] mx-auto px-2 lg:px-4 py-4 bg-[var(--amazon-bg)] min-h-screen text-[var(--amazon-text)]">
      {/* Breadcrumbs */}
      <div className="text-[13px] text-[var(--amazon-text-dim)] mb-2">
        <span className="hover:text-amazon-orange hover:underline cursor-pointer">Your Account</span> 
        <span className="mx-1 text-[#C45500]">›</span> 
        <span className="text-[#C45500]">Your Orders</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
        <h1 className="text-[28px] font-normal text-[var(--amazon-text)] mb-2 md:mb-0">Your Orders</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="Search all orders" 
              className="pl-8 pr-3 py-1.5 bg-[var(--amazon-card)] border border-[var(--amazon-border)] rounded-sm w-[250px] shadow-[0_1px_2px_rgba(15,17,17,0.15)_inset] focus:outline-none focus:border-amazon-orange focus:ring-1 focus:ring-amazon-orange text-[13px] text-[var(--amazon-text)]"
            />
          </div>
          <button className="bg-[var(--amazon-text)] hover:opacity-80 text-[var(--amazon-bg)] px-4 py-1.5 rounded-full text-[13px] font-medium shadow-sm transition-opacity">
            Search Orders
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--amazon-border)] mb-4">
        <button 
          onClick={() => setActiveTab('orders')}
          className={`pb-1 text-[14px] font-medium transition-colors ${activeTab === 'orders' ? 'text-[var(--amazon-text)] border-b-2 border-amazon-orange' : 'text-[#007185] hover:text-[#C45500] hover:underline'}`}
        >
          Orders
        </button>
        <button 
          onClick={() => setActiveTab('buy-again')}
          className={`pb-1 text-[14px] font-medium transition-colors ${activeTab === 'buy-again' ? 'text-[var(--amazon-text)] border-b-2 border-amazon-orange' : 'text-[#007185] hover:text-[#C45500] hover:underline'}`}
        >
          Buy Again
        </button>
        <button 
          onClick={() => setActiveTab('not-shipped')}
          className={`pb-1 text-[14px] font-medium transition-colors ${activeTab === 'not-shipped' ? 'text-[var(--amazon-text)] border-b-2 border-amazon-orange' : 'text-[#007185] hover:text-[#C45500] hover:underline'}`}
        >
          Not Yet Shipped
        </button>
      </div>

      {/* Dropdown */}
      <div className="mb-4">
        <span className="text-[14px] font-medium">{orders.length} orders</span> <span className="text-[14px]">placed in</span>
        <select className="ml-2 bg-[var(--amazon-card-hover)] border border-[var(--amazon-border)] rounded-lg px-2 py-1 text-[13px] font-medium shadow-sm focus:outline-none text-[var(--amazon-text)]">
          <option>past 3 months</option>
          <option>past 6 months</option>
          <option>2026</option>
        </select>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-10">
            <Package size={40} className="text-gray-400 mx-auto mb-2" />
            <h2 className="text-[18px] text-[var(--amazon-text)]">No orders yet</h2>
            <p className="text-[14px] text-[var(--amazon-text-dim)]">Your past purchases will appear here.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="border border-[var(--amazon-border)] rounded-lg overflow-hidden bg-[var(--amazon-card)] shadow-sm">
              {/* Order Header */}
              <div className="bg-[var(--amazon-card-hover)] px-4 py-3 border-b border-[var(--amazon-border)] flex flex-wrap justify-between gap-4">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[var(--amazon-text-dim)] uppercase">Order Placed</span>
                    <span className="text-[14px] text-[var(--amazon-text)]">{order.date}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[var(--amazon-text-dim)] uppercase">Total</span>
                    <span className="text-[14px] text-[var(--amazon-text)]">₹{order.total}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[12px] text-[var(--amazon-text-dim)] uppercase">Ship To</span>
                    <span className="text-[14px] text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer flex items-center gap-1">
                      Priya Sharma <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col sm:text-right">
                  <span className="text-[12px] text-[var(--amazon-text-dim)] uppercase">Order # {order.id.replace('order-', '402-6519906-8370736')}</span>
                  <div className="text-[13px] text-[#007185]">
                    <span className="hover:text-[#C45500] hover:underline cursor-pointer">View order details</span>
                    <span className="mx-2 text-[var(--amazon-border)]">|</span>
                    <span className="hover:text-[#C45500] hover:underline cursor-pointer">Invoice <svg className="inline" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg></span>
                  </div>
                </div>
              </div>

              {/* Order Body */}
              <div className="p-4 bg-[var(--amazon-card)]">
                <h3 className="text-[18px] font-bold text-[var(--amazon-text)] mb-1">
                  {order.status.toLowerCase().includes('delivered') ? 'Delivered' : order.status}
                </h3>
                <p className="text-[14px] text-[var(--amazon-text)] mb-4">Package was handed to resident</p>
                
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row gap-6 mb-4 last:mb-0">
                    <div className="flex-1 flex gap-4">
                      <div 
                        className="w-[90px] h-[90px] shrink-0 bg-white border border-[var(--amazon-border)] rounded-md flex items-center justify-center p-1 cursor-pointer"
                        onClick={() => setSelectedProduct(item as any)}
                      >
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                          <span className="text-3xl">{item.image}</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <h4 
                          className="text-[14px] text-[#007185] hover:text-[#C45500] hover:underline cursor-pointer font-medium mb-1 line-clamp-2"
                          onClick={() => setSelectedProduct(item as any)}
                        >
                          {item.name}
                        </h4>
                        <div className="text-[12px] text-[var(--amazon-text-dim)] mb-2">Return window closed</div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <button 
                            onClick={() => handleBuyItAgain(item)}
                            className="bg-[#FFD814] hover:bg-[#F7CA00] text-black px-3 py-1.5 rounded-full border border-[#FCD200] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] flex items-center gap-1 transition-colors"
                          >
                            <Repeat size={14} /> Buy it again
                          </button>
                          <button 
                            onClick={() => setSelectedProduct(item as any)}
                            className="bg-[var(--amazon-card)] hover:bg-[var(--amazon-card-hover)] text-[var(--amazon-text)] px-3 py-1.5 rounded-full border border-[var(--amazon-border)] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] transition-colors"
                          >
                            View your item
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons Right Side */}
                    <div className="flex flex-col gap-2 min-w-[220px] shrink-0">
                      <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-black px-4 py-1.5 rounded-full shadow-[0_2px_5px_0_rgba(213,217,217,.5)] border border-[#FCD200] text-[13px] transition-colors">
                        Get product support
                      </button>
                      <button className="w-full bg-[var(--amazon-card)] hover:bg-[var(--amazon-card-hover)] text-[var(--amazon-text)] px-4 py-1.5 rounded-full border border-[var(--amazon-border)] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] transition-colors">
                        Track package
                      </button>
                      <button className="w-full bg-[var(--amazon-card)] hover:bg-[var(--amazon-card-hover)] text-[var(--amazon-text)] px-4 py-1.5 rounded-full border border-[var(--amazon-border)] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] transition-colors">
                        Leave seller feedback
                      </button>
                      <button className="w-full bg-[var(--amazon-card)] hover:bg-[var(--amazon-card-hover)] text-[var(--amazon-text)] px-4 py-1.5 rounded-full border border-[var(--amazon-border)] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] transition-colors">
                        Leave delivery feedback
                      </button>
                      <button className="w-full bg-[var(--amazon-card)] hover:bg-[var(--amazon-card-hover)] text-[var(--amazon-text)] px-4 py-1.5 rounded-full border border-[var(--amazon-border)] shadow-[0_2px_5px_0_rgba(213,217,217,.5)] text-[13px] transition-colors">
                        Write a product review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
