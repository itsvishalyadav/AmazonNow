import { useEffect, useState } from 'react';
import { Package, ChevronRight, Clock, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import { getHistory, postCheckout, type HistoryResponse } from '../lib/api';

const DEMO_USER_ID = 'user-demo-01';

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<HistoryResponse['orders']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderingId, setOrderingId] = useState<string | null>(null);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  const toggleDetails = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  const handleReorder = async (order: HistoryResponse['orders'][0]) => {
    setOrderingId(order.id);
    try {
      // Create proper CartItem array for checkout
      const cartItems = order.items.map(i => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        price: i.price,
        reason: 'Reordered',
        confidence: 1
      }));
      
      await postCheckout({ userId: DEMO_USER_ID, items: cartItems });
      alert(`Order Placed Successfully! (Duplicate of ${order.id})`);
    } catch (err) {
      alert('Failed to place order. Please try again.');
    } finally {
      setOrderingId(null);
    }
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
      <div className="history-container" style={{ textAlign: 'center', marginTop: '40px' }}>
        <p style={{ color: 'var(--amazon-muted)' }}>Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="history-container" style={{ textAlign: 'center', marginTop: '40px' }}>
        <Package size={40} style={{ color: 'var(--amazon-muted)', margin: '0 auto 10px' }} />
        <h2 style={{ color: 'var(--amazon-text)', fontSize: '18px' }}>No orders yet</h2>
        <p style={{ color: 'var(--amazon-muted)', fontSize: '14px' }}>Your past purchases will appear here.</p>
      </div>
    );
  }

  return (
    <div className="history-container">
      <div className="history-header">
        <h2>Your Orders</h2>
        <div className="history-filters">
          <button className="filter-chip active">All time</button>
        </div>
      </div>

      <div className="orders-list">
        {orders.map(order => (
          <div key={order.id} className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-xl mb-6">
            {/* Premium E-commerce Header */}
            <div className="bg-black/30 px-5 py-3 border-b border-white/5 flex flex-wrap justify-between gap-4">
              <div className="flex gap-8">
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Order Placed</span>
                  <span className="text-[14px] text-white font-medium">{order.date}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Total</span>
                  <span className="text-[14px] text-white font-medium">₹{order.total}</span>
                </div>
              </div>
              <div className="flex flex-col sm:text-right">
                <span className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Order #</span>
                <span className="text-[13px] text-gray-200 font-mono bg-white/5 px-2 py-0.5 rounded-md border border-white/10">{order.id}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-5">
              <h3 className="text-[18px] text-emerald-400 font-extrabold mb-5 flex items-center gap-2">
                <CheckIcon className="w-5 h-5 stroke-[3]" />
                {order.status}
              </h3>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 flex flex-col gap-4">
                  {(expandedOrders.has(order.id) ? order.items : order.items.slice(0, 2)).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors">
                      <div className="w-16 h-16 shrink-0 bg-white/10 border border-white/10 rounded-xl flex items-center justify-center text-3xl shadow-inner backdrop-blur-md">
                        {item.image}
                      </div>
                      <div className="flex flex-col justify-center py-1">
                        <h4 className="text-[15px] text-white font-bold mb-1">{item.name}</h4>
                        <p className="text-[13px] text-gray-400 font-medium">
                          Qty: {item.qty} <span className="mx-2">•</span> ₹{item.price}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {order.items.length > 2 && (
                    <button 
                      onClick={() => toggleDetails(order.id)} 
                      className="text-[13px] text-amazon-orange hover:text-amazon-orange-hover font-bold flex items-center gap-1 mt-1 px-3 py-2 rounded-lg hover:bg-amazon-orange-dim w-max transition-colors"
                    >
                      {expandedOrders.has(order.id) ? (
                        <>Show less <ChevronUp size={16} strokeWidth={2.5} /></>
                      ) : (
                        <>See {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''} <ChevronDown size={16} strokeWidth={2.5} /></>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col gap-3 min-w-[200px] shrink-0 border-t border-white/10 md:border-t-0 md:border-l md:pl-6 pt-4 md:pt-0">
                  <button 
                    disabled={order.status.toLowerCase().includes('delivered')}
                    className="w-full bg-white text-black hover:bg-gray-200 px-4 py-2.5 rounded-lg font-bold text-[14px] transition-all shadow-[0_4px_12px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Track Package
                  </button>
                  <button 
                    onClick={() => handleReorder(order)}
                    disabled={orderingId === order.id}
                    className="w-full flex items-center justify-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] text-black px-4 py-2.5 rounded-lg font-extrabold text-[14px] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {orderingId === order.id ? (
                      <Clock size={16} className="spin" /> 
                    ) : (
                      <Repeat size={16} strokeWidth={2.5} /> 
                    )}
                    {orderingId === order.id ? 'Reordering...' : 'Buy it again'}
                  </button>
                  <button className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 px-4 py-2.5 rounded-lg font-bold text-[14px] transition-all active:scale-95">
                    View Invoice
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  );
}
