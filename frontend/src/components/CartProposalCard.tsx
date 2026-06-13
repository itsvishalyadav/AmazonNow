// frontend/src/components/CartProposalCard.tsx
// The hero output component — displays intentSummary, budget bar, assumptions,
// list of ItemRows, RebalanceBanner, and the "Buy now" action.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { ShoppingCart, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { CartProposal, CartItem, Swap } from '../lib/types';
import ItemRow from './ItemRow';
import RebalanceBanner from './RebalanceBanner';

interface CartProposalCardProps {
  proposal: CartProposal;
  onCheckout: (items: CartItem[]) => void;
  isCheckingOut: boolean;
  onFeedbackRemove?: (productId: string, productName: string) => void;
  onFeedbackAdd?: (productName: string) => void;
  onReply?: (text: string) => void;
}

export default function CartProposalCard({
  proposal,
  onCheckout,
  isCheckingOut,
  onFeedbackRemove,
  onFeedbackAdd,
  onReply,
}: CartProposalCardProps) {
  const [items, setItems] = useState<CartItem[]>(proposal.items);
  const [swapsReverted, setSwapsReverted] = useState<Set<string>>(new Set());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemText, setAddItemText] = useState('');

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const budget = proposal.budget;
  const withinBudget = budget === null || total <= budget;
  const budgetPct = budget ? Math.min((total / budget) * 100, 100) : null;

  // Remove an item (fire feedback + remove locally)
  const handleRemove = (productId: string, productName: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    onFeedbackRemove?.(productId, productName);
  };

  const handleAddItemSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val && onFeedbackAdd) {
        onFeedbackAdd(val);
        setAddItemText('');
        setIsAddingItem(false);
      }
    } else if (e.key === 'Escape') {
      setIsAddingItem(false);
      setAddItemText('');
    }
  };

  // Revert a swap — put the original item back
  const handleRevert = (swap: Swap) => {
    setSwapsReverted((prev) => new Set([...prev, swap.from]));
    // Find current item with swap.to and rename it back (price unknown — use original name)
    setItems((prev) =>
      prev.map((i) =>
        i.name === swap.to
          ? { ...i, name: swap.from, reason: 'Reverted to original selection.', price: i.price + swap.saved / i.qty }
          : i
      )
    );
  };

  const handleReplySubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val && onReply) {
        onReply(val);
      }
    }
  };

  if (proposal.clarifyingQuestion && items.length === 0) {
    return (
      <div className="cart-card">
        <div className="cart-clarify">
          <Info size={22} className="clarify-icon" />
          <p className="clarify-text">{proposal.clarifyingQuestion}</p>
          <div style={{ marginTop: '16px', width: '100%', maxWidth: '400px' }}>
            <input 
              type="text" 
              placeholder="Type your answer and press Enter..." 
              onKeyDown={handleReplySubmit}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--amazon-border)',
                background: 'var(--amazon-dark)',
                color: 'var(--amazon-text)',
                outline: 'none',
                fontSize: '15px'
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  const activeSwaps = proposal.rebalance?.filter((s) => !swapsReverted.has(s.from));

  return (
    <div className="cart-card">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="cart-header">
        <div className="cart-header-left">
          <ShoppingCart size={20} className="cart-icon" />
          <div>
            <h2 className="cart-title">Your Cart</h2>
            <p className="cart-intent">{proposal.intentSummary}</p>
          </div>
        </div>
        <div className="cart-item-count">
          {items.length} item{items.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* ── Budget bar ──────────────────────────────────────────── */}
      {budget !== null && budgetPct !== null && (
        <div className="budget-bar-wrapper">
          <div className="budget-bar-track">
            <div
              className="budget-bar-fill"
              style={{
                width: `${budgetPct}%`,
                background: withinBudget ? 'var(--amazon-success)' : 'var(--amazon-danger)',
              }}
            />
          </div>
          <div className="budget-bar-labels">
            <span className={`budget-total ${withinBudget ? 'within' : 'over'}`}>
              {withinBudget ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              ₹{Math.round(total)}
            </span>
            <span className="budget-limit">Budget: ₹{budget}</span>
          </div>
        </div>
      )}

      {/* ── Total (no budget) ───────────────────────────────────── */}
      {budget === null && (
        <div className="cart-total-row">
          <span className="cart-total-label">Estimated total</span>
          <span className="cart-total-value">₹{Math.round(total)}</span>
        </div>
      )}

      {/* ── Rebalance banner (F3) ───────────────────────────────── */}
      {activeSwaps && activeSwaps.length > 0 && (
        <RebalanceBanner swaps={activeSwaps} onRevert={handleRevert} />
      )}

      {/* ── Assumptions ─────────────────────────────────────────── */}
      {proposal.assumptions.length > 0 && (
        <div className="cart-assumptions">
          <span className="assumptions-label">Assumed:</span>
          <ul className="assumptions-list">
            {proposal.assumptions.map((a, i) => (
              <li key={i} className="assumption-item">
                <span className="assumption-dot">·</span> {a}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Item list ───────────────────────────────────────────── */}
      <div className="cart-items">
        {items.map((item) => (
          <ItemRow key={item.productId} item={item} onRemove={(id) => handleRemove(id, item.name)} />
        ))}
      </div>

      {/* ── Add Item (F9) ────────────────────────────────────────── */}
      <div className="cart-add-item-row">
        {isAddingItem ? (
          <input
            type="text"
            className="add-item-input"
            autoFocus
            placeholder="What should we prioritise next time? (Enter to save)"
            value={addItemText}
            onChange={(e) => setAddItemText(e.target.value)}
            onKeyDown={handleAddItemSubmit}
            onBlur={() => { setIsAddingItem(false); setAddItemText(''); }}
          />
        ) : (
          <button className="add-item-btn" onClick={() => setIsAddingItem(true)}>
            + Add a missing item
          </button>
        )}
      </div>

      {/* ── Clarifying question (with items) ────────────────────── */}
      {proposal.clarifyingQuestion && items.length > 0 && (
        <div className="cart-clarify-inline" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '12px 16px', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
            <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
            <span style={{ lineHeight: '1.4' }}>{proposal.clarifyingQuestion}</span>
          </div>
          <div style={{ width: '100%', marginTop: '4px' }}>
            <input 
              type="text" 
              placeholder="Type your answer and press Enter..." 
              onKeyDown={handleReplySubmit}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid rgba(255, 184, 0, 0.4)',
                background: 'rgba(0,0,0,0.15)',
                color: 'var(--amazon-text)',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
      )}

      {/* ── Buy now ─────────────────────────────────────────────── */}
      <div className="cart-footer">
        <div className="cart-footer-total">
          <span>Total</span>
          <strong>₹{Math.round(total)}</strong>
        </div>
        <button
          id="buy-now-btn"
          className="buy-now-btn"
          onClick={() => onCheckout(items)}
          disabled={isCheckingOut || items.length === 0}
          aria-label="Place order"
        >
          {isCheckingOut ? 'Placing order…' : '⚡ Buy now'}
        </button>
      </div>
    </div>
  );
}
