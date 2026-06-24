// frontend/src/components/ItemRow.tsx
// Renders one cart item — name, qty, price, reason, confidence pip,
// nudge / dietaryFlag chips, and a "substituted" tag if F7 swapped it.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowLeftRight, Zap, AlertCircle, ShieldCheck, Sparkles, TrendingDown, Plus, Minus } from 'lucide-react';
import type { CartItem } from '../lib/types';

interface ItemRowProps {
  item: CartItem;
  onRemove?: (productId: string) => void;
  onClickProduct?: (item: CartItem) => void;
  onUpdateQty?: (productId: string, newQty: number) => void;
  onSwap?: (oldProductId: string, altItem: { id: string, name: string, price: number, reason: string }) => void;
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

export default function ItemRow({ item, onRemove, onClickProduct, onUpdateQty, onSwap }: ItemRowProps) {
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
                      <span className="text-[11px] text-[var(--amazon-muted)] ml-0.5">({item.reviewCount.toLocaleString()})</span>
                    )}
                  </div>
                )}
                {item.isPrime && (
                  <div className="flex items-center">
                    <span className="text-[#00A8E1] font-extrabold italic text-[12px] tracking-tight">prime</span>
                  </div>
                )}
                {item.deliveryTime && (
                  <span className="text-[11px] font-medium text-[var(--amazon-text-dim)]">
                    Get it <span className="font-bold text-[var(--amazon-text)]">{item.deliveryTime}</span>
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="item-price-group flex flex-col items-end">
            <span className="item-price">₹{total}</span>
            <div className="flex items-center gap-2 mt-1 bg-black/5 dark:bg-white/5 rounded-md p-1 border border-[var(--amazon-border-light)]">
              <button 
                className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10 text-[var(--amazon-muted)] hover:text-[var(--amazon-text)] transition-colors"
                onClick={(e) => { e.stopPropagation(); onUpdateQty?.(item.productId, Math.max(1, item.qty - 1)); }}
              >
                <Minus size={12} />
              </button>
              <span className="text-[12px] font-medium w-3 text-center leading-none text-[var(--amazon-text)]">{item.qty}</span>
              <button 
                className="w-5 h-5 flex items-center justify-center rounded-sm hover:bg-black/10 dark:hover:bg-white/10 text-[var(--amazon-muted)] hover:text-[var(--amazon-text)] transition-colors"
                onClick={(e) => { e.stopPropagation(); onUpdateQty?.(item.productId, item.qty + 1); }}
              >
                <Plus size={12} />
              </button>
            </div>
            {item.qty > 1 && <span className="text-[10px] text-[var(--amazon-muted)] mt-1">₹{item.price} each</span>}
          </div>
        </div>

        {/* ── Trust Badges ────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 mt-2 mb-2">
          {item.confidence >= 0.9 && !item.substituteFor && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
              <Sparkles size={10} /> Top Match
            </span>
          )}
          {item.price < 50 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingDown size={10} /> Best Value
            </span>
          )}
          {item.dietaryFlag && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
              <ShieldCheck size={10} /> {item.dietaryFlag}
            </span>
          )}
          {item.nudge && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Zap size={10} /> {item.nudge}
            </span>
          )}
          {item.substituteFor && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <ArrowLeftRight size={10} /> Sub: {item.substituteFor.slice(0, 15)}
            </span>
          )}
        </div>

        {/* Confidence (small pip) */}
        <div className="mb-2 opacity-80">
          <ConfidencePip value={item.confidence} />
        </div>

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

        {/* Chips row removed in favor of Trust Badges above */}

        {/* Alternatives row */}
        {item.alternatives && item.alternatives.length > 0 && (
          <div className="item-alternatives">
            <button
              className="flex items-center gap-2 mt-2 mb-1 px-3 py-1.5 rounded-full text-[11px] font-bold text-[var(--amazon-text-dim)] bg-[var(--amazon-dark)] hover:bg-[var(--amazon-card-hover)] border border-[var(--amazon-border)] hover:border-[var(--amazon-orange)] hover:text-[var(--amazon-text)] transition-all shadow-sm"
              onClick={() => setAltExpanded((v) => !v)}
              aria-expanded={altExpanded}
            >
              <ArrowLeftRight size={12} className="text-[var(--amazon-orange)]" /> {altExpanded ? 'Hide alternatives' : `Show ${item.alternatives.length} alternative${item.alternatives.length > 1 ? 's' : ''}`}
            </button>
            {altExpanded && (
              <ul className="flex flex-col gap-2 mt-2 pl-3 border-l-2 border-[var(--amazon-border)]">
                {item.alternatives.map(alt => (
                  <li key={alt.id} className="flex justify-between items-start gap-3 p-2.5 rounded-lg hover:bg-[var(--amazon-dark)] transition-colors border border-transparent hover:border-[var(--amazon-border-light)]">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="text-[13px] font-bold text-[var(--amazon-text)] leading-tight">{alt.name}</span>
                        <span className="text-[13px] font-black text-[var(--amazon-text)] shrink-0">₹{alt.price}</span>
                      </div>
                      <p className="text-[11px] text-[var(--amazon-muted)] leading-relaxed">{alt.reason}</p>
                    </div>
                    {onSwap && (
                      <button 
                        className="px-3 py-1.5 rounded-lg bg-[var(--amazon-orange-dim)] text-[var(--amazon-orange)] text-[11px] font-bold border border-[var(--amazon-orange-dim)] hover:bg-[var(--amazon-orange)] hover:text-black transition-colors shrink-0 mt-1"
                        onClick={() => {
                          onSwap(item.productId, alt);
                          setAltExpanded(false);
                        }}
                      >
                        Swap
                      </button>
                    )}
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
