// frontend/src/components/OrderConfirm.tsx
// Mock order confirmation screen shown after "Buy now" is tapped.
// ─────────────────────────────────────────────────────────────────────────────
import { CheckCircle, Package, Clock, ArrowLeft } from 'lucide-react';

interface OrderConfirmProps {
  orderId: string;
  total: number;
  itemCount: number;
  onBack: () => void;
}

export default function OrderConfirm({ orderId, total, itemCount, onBack }: OrderConfirmProps) {
  return (
    <div className="order-confirm">
      {/* Success ring */}
      <div className="order-confirm-ring">
        <CheckCircle size={52} className="order-confirm-icon" />
      </div>

      <h2 className="order-confirm-title">Order Confirmed!</h2>
      <p className="order-confirm-sub">
        Your {itemCount} item{itemCount !== 1 ? 's' : ''} are on their way
      </p>

      {/* Order card */}
      <div className="order-confirm-card">
        <div className="order-detail-row">
          <Package size={16} />
          <span>Order ID</span>
          <code className="order-id">{orderId}</code>
        </div>
        <div className="order-detail-row">
          <span className="order-detail-label">Total charged</span>
          <span className="order-detail-value">₹{total}</span>
        </div>
        <div className="order-detail-row">
          <Clock size={16} />
          <span>Estimated delivery</span>
          <strong className="order-eta">15–30 min</strong>
        </div>
      </div>

      {/* Delivery note */}
      <div className="order-confirm-note">
        🎉 This is a hackathon prototype — no real charge or delivery!
      </div>

      {/* Back button */}
      <button className="order-back-btn" onClick={onBack} id="order-back-btn">
        <ArrowLeft size={16} />
        Shop again
      </button>
    </div>
  );
}
