// frontend/src/components/CartProposalCard.tsx
// The hero output component — displays intentSummary, budget bar, assumptions,
// list of ItemRows, RebalanceBanner, and the "Buy now" action.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { ShoppingCart, Info, CheckCircle2, AlertTriangle, Search } from 'lucide-react';
import type { CartProposal, CartItem, Swap } from '../lib/types';
import { postSearchItems } from '../lib/api';
import ItemRow from './ItemRow';
import RebalanceBanner from './RebalanceBanner';
import SwipeCheckoutButton from './SwipeCheckoutButton';
import IconRenderer from './IconRenderer';

interface CartProposalCardProps {
  proposal: CartProposal;
  onCheckout: (items: CartItem[]) => void;
  isCheckingOut: boolean;
  onFeedbackRemove?: (productId: string, productName: string) => void;
  onFeedbackAdd?: (productName: string) => void;
  onReply?: (text: string) => void;
  onClickProduct?: (item: CartItem) => void;
}

export default function CartProposalCard({
  proposal,
  onCheckout,
  isCheckingOut,
  onFeedbackRemove,
  onFeedbackAdd,
  onReply,
  onClickProduct,
}: CartProposalCardProps) {
  const [items, setItems] = useState<CartItem[]>(proposal.items);
  const [swapsReverted, setSwapsReverted] = useState<Set<string>>(new Set());
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [addItemText, setAddItemText] = useState('');
  const [suggestions, setSuggestions] = useState<CartItem[]>([]);
  const [deliveryMode, setDeliveryMode] = useState<'flash'|'saver'>('flash');

  useEffect(() => {
    setItems(proposal.items);
  }, [proposal.items]);

  useEffect(() => {
    if (!addItemText.trim() || !isAddingItem) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await postSearchItems({ query: addItemText, topK: 4 });
        setSuggestions(res.items || []);
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [addItemText, isAddingItem]);

  const displayedItems = deliveryMode === 'flash' ? items : items.map(i => ({
    ...i,
    name: i.name.toLowerCase().includes('amazon basics') ? i.name : `Amazon Basics ${i.name.replace(/^(Premium|Fresh|Organic|Amul|Britannia|Dolo)\s+/i, '')}`,
    price: Math.max(1, Math.floor(i.price * 0.7)), // 30% discount
    reason: 'Cheaper Amazon Basics alternative'
  }));

  const total = displayedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const budget = proposal.budget;
  const withinBudget = budget === null || total <= budget;
  const budgetPct = budget ? Math.min((total / budget) * 100, 100) : null;

  const groupedItems = displayedItems.reduce((acc, item) => {
    const cat = item.category || 'Essentials';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  // Remove an item (fire feedback + remove locally)
  const handleRemove = (productId: string, productName: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    onFeedbackRemove?.(productId, productName);
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    setItems((prev) => prev.map((i) => i.productId === productId ? { ...i, qty: newQty } : i));
  };

  const handleSwap = (oldProductId: string, altItem: { id: string, name: string, price: number, reason: string }) => {
    setItems((prev) => prev.map((i) => {
      if (i.productId === oldProductId) {
        return {
          ...i,
          productId: altItem.id,
          name: altItem.name,
          price: altItem.price,
          reason: altItem.reason,
          substituteFor: i.name,
          imageUrl: '', // Clear image so placeholder handles it
        };
      }
      return i;
    }));
  };

  const handleAddItemSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const val = e.currentTarget.value.trim();
      if (val && onFeedbackAdd) {
        onFeedbackAdd(val);
        setAddItemText('');
        setSuggestions([]);
        setIsAddingItem(false);
      }
    } else if (e.key === 'Escape') {
      setIsAddingItem(false);
      setSuggestions([]);
      setAddItemText('');
    }
  };

  const handleSelectSuggestion = (item: CartItem) => {
    if (onFeedbackAdd) {
      onFeedbackAdd(item.name);
      setAddItemText('');
      setSuggestions([]);
      setIsAddingItem(false);
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


  const activeSwaps = proposal.rebalance?.filter((s) => !swapsReverted.has(s.from));

  return (
    <div className="cart-card">
      {/* ── Header ─────────────────────────────────────────────── */}
      {proposal.occasion ? (
        <div className={`w-full p-6 text-[var(--amazon-text)] rounded-t-[14px] bg-gradient-to-r ${proposal.occasion.colorGradient} shadow-inner`}>
          <div className="flex justify-between items-start">
            <div>
              <span className="block mb-2 drop-shadow-md text-[var(--amazon-text-dim)]">
                <IconRenderer iconName={proposal.occasion.icon} size={38} strokeWidth={2.5} />
              </span>
              <h2 className="text-[26px] font-black tracking-tight drop-shadow-md mb-1">{proposal.occasion.name}</h2>
              <p className="text-[14px] font-semibold opacity-90 drop-shadow-sm max-w-[80%]">{proposal.intentSummary}</p>
            </div>
            <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
              {displayedItems.length} item{displayedItems.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      ) : (
        <div className="cart-header">
          <div className="cart-header-left">
            <ShoppingCart size={20} className="cart-icon" />
            <div>
              <h2 className="cart-title">Your Cart</h2>
              <p className="cart-intent">{proposal.intentSummary}</p>
            </div>
          </div>
          <div className="cart-item-count">
            {displayedItems.length} item{displayedItems.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* ── Smart Slider (Speed vs Price) ───────────────────────── */}
      <div className="mx-5 mb-4 mt-2 p-1 bg-black/40 backdrop-blur-md rounded-xl border border-white/10 flex relative overflow-hidden shrink-0">
        <div 
          className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#f97316] rounded-lg transition-transform duration-300 shadow-lg"
          style={{ transform: deliveryMode === 'flash' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))' }}
        />
        <button 
          className={`flex-1 flex flex-col items-center justify-center py-2.5 z-10 transition-colors ${deliveryMode === 'flash' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setDeliveryMode('flash')}
        >
          <span className="font-extrabold text-[14px]">⚡ Flash (10 mins)</span>
          <span className="text-[11px] font-bold opacity-80">Standard Price</span>
        </button>
        <button 
          className={`flex-1 flex flex-col items-center justify-center py-2.5 z-10 transition-colors ${deliveryMode === 'saver' ? 'text-black' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setDeliveryMode('saver')}
        >
          <span className="font-extrabold text-[14px]">📦 Saver (45 mins)</span>
          <span className="text-[11px] font-bold opacity-80">Amazon Basics (-30%)</span>
        </button>
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
        {proposal.occasion ? (
          Object.entries(groupedItems).map(([category, catItems]) => (
            <div key={category} className="mb-4 bg-[var(--amazon-card)] border border-[var(--amazon-border-light)] rounded-xl overflow-hidden shadow-[var(--shadow-float)]">
              <h3 className="text-[13px] font-black text-[var(--amazon-text-dim)] uppercase tracking-[0.1em] px-4 py-3 bg-black/5 dark:bg-black/20 border-b border-[var(--amazon-border-light)]">
                {category}
              </h3>
              <div className="p-2">
                {catItems.map((item) => (
                  <ItemRow 
                    key={item.productId} 
                    item={item} 
                    onRemove={(id) => handleRemove(id, item.name)} 
                    onClickProduct={onClickProduct} 
                    onUpdateQty={handleUpdateQty}
                    onSwap={handleSwap}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          displayedItems.map((item) => (
            <ItemRow 
              key={item.productId} 
              item={item} 
              onRemove={(id) => handleRemove(id, item.name)} 
              onClickProduct={onClickProduct} 
              onUpdateQty={handleUpdateQty}
              onSwap={handleSwap}
            />
          ))
        )}
      </div>

      {/* ── Add Item (F9) ────────────────────────────────────────── */}
      <div className="cart-add-item-row relative">
        {isAddingItem ? (
          <div className="w-full relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                className="add-item-input pl-10"
                autoFocus
                placeholder="Search for an item..."
                value={addItemText}
                onChange={(e) => setAddItemText(e.target.value)}
                onKeyDown={handleAddItemSubmit}
                onBlur={() => setTimeout(() => { setIsAddingItem(false); setAddItemText(''); setSuggestions([]); }, 200)}
              />
            </div>
            {suggestions.length > 0 && (
              <div className="absolute left-0 right-0 bottom-full mb-1 bg-[var(--amazon-card)] border border-[var(--amazon-border)] rounded-xl overflow-hidden shadow-[var(--shadow-float)] z-50">
                {suggestions.map((item) => (
                  <div 
                    key={item.productId}
                    className="px-4 py-3 flex items-center gap-3 hover:bg-[var(--amazon-dark)] cursor-pointer border-b border-[var(--amazon-border-light)] last:border-none transition-colors"
                    onMouseDown={(e) => { e.preventDefault(); handleSelectSuggestion(item); }}
                  >
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-8 h-8 rounded-md object-contain bg-black/5 dark:bg-white/10" />
                    ) : (
                      <div className="w-8 h-8 rounded-md bg-black/5 dark:bg-white/10 flex items-center justify-center">
                        <ShoppingCart size={14} className="text-[var(--amazon-muted)]" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[var(--amazon-text)] truncate">{item.name}</p>
                      <p className="text-[11px] text-[var(--amazon-muted)] truncate">{item.category}</p>
                    </div>
                    <span className="text-[13px] font-bold text-amazon-orange">₹{item.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
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
        <div className="flex-1 ml-4 min-w-[200px]">
          <SwipeCheckoutButton 
            onConfirm={() => onCheckout(displayedItems)}
            disabled={displayedItems.length === 0}
            isLoading={isCheckingOut}
            text={`Swipe to buy (${deliveryMode === 'flash' ? '10 mins' : '45 mins'})`}
          />
        </div>
      </div>
    </div>
  );
}
