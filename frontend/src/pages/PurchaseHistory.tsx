import { useEffect, useState } from 'react';
import { Package, ChevronRight, Clock, Repeat, ChevronDown, ChevronUp } from 'lucide-react';
import { getHistory, postCheckout, type HistoryResponse } from '../lib/api';

const DEMO_USER_ID = 'user-demo-01';

export default function PurchaseHistory() {
  const [orders, setOrders] = useState<HistoryResponse['orders']>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [orderingId, setOrderingId] = useState<string | null>(null);

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
          <div key={order.id} className="order-card">
            <div className="order-header">
              <div className="order-meta">
                <span className="order-date">{order.date}</span>
                <span className="order-total">Total: ₹{order.total}</span>
              </div>
              <div className="order-status-badge">
                <CheckIcon className="status-icon" />
                {order.status}
              </div>
            </div>

            <div className="order-body">
              {!expandedOrders.has(order.id) ? (
                <div className="order-items-preview">
                  {order.items.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="item-preview-chip" title={item.name}>
                      <span className="item-emoji">{item.image}</span>
                      <span className="item-qty">x{item.qty}</span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="item-preview-chip" style={{ fontSize: '14px', fontWeight: 600 }}>
                      +{order.items.length - 4}
                    </div>
                  )}
                  <div className="items-summary">
                    {order.items.map(i => i.name).join(', ')}
                  </div>
                </div>
              ) : (
                <div className="order-items-detail">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="item-detail-row" style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--amazon-border-light)' }}>
                      <div className="item-preview-chip" style={{ marginRight: '12px' }}>
                        <span className="item-emoji">{item.image}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', color: 'var(--amazon-text)', fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--amazon-muted)' }}>Qty: {item.qty}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--amazon-text)' }}>
                        ₹{item.price * item.qty}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="order-footer">
              <span className="order-id">Order #{order.id}</span>
              <div className="order-actions">
                <button 
                  className="action-btn text-btn" 
                  onClick={() => toggleDetails(order.id)}
                >
                  {expandedOrders.has(order.id) ? 'Hide Details' : 'View Details'}
                  {expandedOrders.has(order.id) ? <ChevronUp size={14} className="ml-1" /> : <ChevronDown size={14} className="ml-1" />}
                </button>
                <button 
                  className="action-btn primary-btn"
                  onClick={() => handleReorder(order)}
                  disabled={orderingId === order.id}
                >
                  {orderingId === order.id ? (
                    <Clock size={14} className="mr-1 spin" /> 
                  ) : (
                    <Repeat size={14} className="mr-1" /> 
                  )}
                  {orderingId === order.id ? 'Reordering...' : 'Reorder'}
                </button>
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
