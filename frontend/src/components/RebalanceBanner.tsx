// frontend/src/components/RebalanceBanner.tsx
// Shown when the Now Agent swapped items to stay within budget (F3).
// Displays a banner with per-swap Accept/Revert controls.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { ArrowLeftRight, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import type { Swap } from '../lib/types';

interface RebalanceBannerProps {
  swaps: Swap[];
  onRevert: (swap: Swap) => void;
}

export default function RebalanceBanner({ swaps, onRevert }: RebalanceBannerProps) {
  const [expanded, setExpanded] = useState(true);
  const [revertedIds, setRevertedIds] = useState<Set<string>>(new Set());

  const totalSaved = swaps.reduce((s, sw) => s + sw.saved, 0);

  const handleRevert = (swap: Swap) => {
    setRevertedIds((prev) => new Set([...prev, swap.from]));
    onRevert(swap);
  };

  return (
    <div className="rebalance-banner" role="alert">
      {/* Header */}
      <button
        className="rebalance-header"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="rebalance-header-left">
          <Sparkles size={16} className="rebalance-icon" />
          <span className="rebalance-title">
            Budget optimised — saved <strong>₹{totalSaved}</strong>
          </span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Swap list */}
      {expanded && (
        <ul className="rebalance-swaps">
          {swaps.map((swap) => {
            const reverted = revertedIds.has(swap.from);
            return (
              <li key={swap.from} className={`rebalance-swap ${reverted ? 'reverted' : ''}`}>
                <ArrowLeftRight size={13} className="swap-arrow" />
                <div className="swap-detail">
                  <span className="swap-from">{swap.from}</span>
                  <span className="swap-to">→ {swap.to}</span>
                  <span className="swap-saved">saved ₹{swap.saved}</span>
                </div>
                {!reverted ? (
                  <button
                    className="swap-revert-btn"
                    onClick={() => handleRevert(swap)}
                    aria-label={`Revert swap of ${swap.from}`}
                  >
                    Revert
                  </button>
                ) : (
                  <span className="swap-reverted-badge">Reverted</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
