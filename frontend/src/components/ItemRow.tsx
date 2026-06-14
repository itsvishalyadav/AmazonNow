// frontend/src/components/ItemRow.tsx
// Renders one cart item — name, qty, price, reason, confidence pip,
// nudge / dietaryFlag chips, and a "substituted" tag if F7 swapped it.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeftRight, Zap, AlertCircle } from 'lucide-react';
import type { CartItem } from '../lib/types';

interface ItemRowProps {
  item: CartItem;
  onRemove?: (productId: string) => void;
  onClickProduct?: (item: CartItem) => void;
}

function ConfidencePip({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    value >= 0.8 ? 'var(--amazon-success)' :
    value >= 0.6 ? 'var(--amazon-orange)' :
    'var(--amazon-danger)';
  const label = value >= 0.8 ? 'High' : value >= 0.6 ? 'Medium' : 'Low';

  return (
    <div className="confidence-pip" title={`Confidence: ${pct}%`}>
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

export default function ItemRow({ item, onRemove, onClickProduct }: ItemRowProps) {
  const [reasonExpanded, setReasonExpanded] = useState(false);
  const [altExpanded, setAltExpanded] = useState(false);

  const total = (item.price * item.qty).toFixed(0);

  return (
    <div className={`item-row ${item.substituteFor ? 'item-row--substituted' : ''}`}>
      {/* Left: image placeholder */}
      <div 
        className="item-image cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onClickProduct?.(item)}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} loading="lazy" />
        ) : (
          <div className="item-image-placeholder">
            {item.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="item-content">
        {/* Top row: name + price */}
        <div className="item-top">
          <div className="item-name-group">
            <span 
              className="item-name cursor-pointer hover:text-amazon-orange transition-colors"
              onClick={() => onClickProduct?.(item)}
            >
              {item.name}
            </span>
            {item.substituteFor && (
              <span className="item-tag item-tag--sub" title={`Substituted for: ${item.substituteFor}`}>
                <ArrowLeftRight size={10} /> Sub
              </span>
            )}
            
            {/* Amazon-like metadata row */}
            {(item.rating || item.deliveryTime || item.isPrime) && (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                {item.rating && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-[12px] font-bold text-[#FF9900]">{item.rating.toFixed(1)}</span>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF9900" xmlns="http://www.w3.org/2000/svg" className="mt-[1px]">
                      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                    </svg>
                    {item.reviewCount && (
                      <span className="text-[11px] text-gray-400 ml-0.5">({item.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}
                {item.isPrime && (
                  <div className="flex items-center">
                    <span className="text-[#00A8E1] font-extrabold italic text-[12px] tracking-tight">prime</span>
                  </div>
                )}
                {item.deliveryTime && (
                  <span className="text-[11px] font-medium text-gray-300">
                    Get it <span className="font-bold text-white">{item.deliveryTime}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="item-price-group">
            <span className="item-price">₹{total}</span>
            <span className="item-unit">
              {item.qty > 1 ? `${item.qty} × ₹${item.price}` : `₹${item.price}`}
            </span>
          </div>
        </div>

        {/* Confidence */}
        <ConfidencePip value={item.confidence} />

        {/* Reason — collapsible */}
        <button
          className="item-reason-toggle"
          onClick={() => setReasonExpanded((v) => !v)}
          aria-expanded={reasonExpanded}
          aria-label="Toggle item reason"
        >
          <span className="item-reason-preview">
            {reasonExpanded ? item.reason : `${item.reason.slice(0, 80)}${item.reason.length > 80 ? '…' : ''}`}
          </span>
          {item.reason.length > 80 && (
            reasonExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />
          )}
        </button>

        {/* Chips row */}
        {(item.nudge || item.dietaryFlag || item.substituteFor) && (
          <div className="item-chips">
            {item.nudge && (
              <span className="chip chip--nudge">
                <Zap size={11} /> {item.nudge}
              </span>
            )}
            {item.dietaryFlag && (
              <span className="chip chip--diet">
                <AlertCircle size={11} /> {item.dietaryFlag}
              </span>
            )}
            {item.substituteFor && (
              <span className="chip chip--sub">
                Was: {item.substituteFor}
              </span>
            )}
          </div>
        )}

        {/* Alternatives row */}
        {item.alternatives && item.alternatives.length > 0 && (
          <div className="item-alternatives">
            <button
              className="item-alt-toggle"
              onClick={() => setAltExpanded((v) => !v)}
              aria-expanded={altExpanded}
            >
              <ArrowLeftRight size={12} /> {altExpanded ? 'Hide alternatives' : `Show ${item.alternatives.length} alternative${item.alternatives.length > 1 ? 's' : ''}`}
            </button>
            {altExpanded && (
              <ul className="item-alt-list">
                {item.alternatives.map(alt => (
                  <li key={alt.id} className="item-alt-row">
                    <div className="item-alt-top">
                      <span className="item-alt-name">{alt.name}</span>
                      <span className="item-alt-price">₹{alt.price}</span>
                    </div>
                    <p className="item-alt-reason">{alt.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <button
          className="item-remove-btn"
          onClick={() => onRemove(item.productId)}
          title="Remove item"
          aria-label={`Remove ${item.name}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
