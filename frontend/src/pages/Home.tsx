// frontend/src/pages/Home.tsx
// The main demo screen — IntentBar at top, CartProposalCard below.
// Handles the full intent → cart → checkout flow.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';
import IntentBar from '../components/IntentBar';
import CartProposalCard from '../components/CartProposalCard';
import LoadingState from '../components/LoadingState';
import OrderConfirm from '../components/OrderConfirm';
import { postIntent, postCheckout, postFeedback } from '../lib/api';
import type { CartProposal, CartItem } from '../lib/types';

const DEMO_USER_ID = 'user-demo-001';

const EXAMPLE_PROMPTS = [
  'kal subah breakfast for 2, under ₹300',
  'paneer butter masala for 4 people',
  'sick at home, need medicines & soup',
  'Diwali party for 10 guests, sweets & snacks',
  'restock my fridge essentials',
];

type AppState = 'idle' | 'loading' | 'result' | 'confirming' | 'confirmed';

export default function Home() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [proposal, setProposal] = useState<CartProposal | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotal, setOrderTotal] = useState(0);
  const [orderItemCount, setOrderItemCount] = useState(0);
  const [hasImage, setHasImage] = useState(false);

  // ── Submit intent ──────────────────────────────────────────────────────────
  const handleIntentSubmit = async (text: string, imageBase64?: string) => {
    setError(null);
    setHasImage(!!imageBase64);

    // If we have an existing proposal, append the context so the AI remembers it!
    let contextualText = text;
    if (proposal) {
      if (proposal.clarifyingQuestion) {
        contextualText = `Context from previous search: "${proposal.intentSummary}". You asked: "${proposal.clarifyingQuestion}". User answers: "${text}"`;
      } else {
        const currentItems = proposal.items.map(i => `${i.qty}x ${i.name}`).join(', ');
        contextualText = `Previous cart intent: "${proposal.intentSummary}". Current items in cart: [${currentItems}]. Follow-up request from user: "${text}". Please generate the final updated list of all items needed.`;
      }
    }

    setProposal(null);
    setAppState('loading');

    try {
      const result = await postIntent({ userId: DEMO_USER_ID, text: contextualText, imageBase64 });
      setProposal(result);
      setAppState('result');
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.');
      setAppState('idle');
    }
  };

  // ── Checkout ───────────────────────────────────────────────────────────────
  const handleCheckout = async (items: CartItem[]) => {
    setAppState('confirming');
    try {
      const res = await postCheckout({ userId: DEMO_USER_ID, items });
      setOrderId(res.orderId);
      setOrderTotal(res.total);
      setOrderItemCount(items.length);
      setAppState('confirmed');
    } catch (err: any) {
      setError(err.message ?? 'Checkout failed. Please try again.');
      setAppState('result');
    }
  };

  // ── Remove feedback ────────────────────────────────────────────────────────
  const handleFeedbackRemove = async (productId: string) => {
    try {
      await postFeedback({ userId: DEMO_USER_ID, removed: [productId] });
    } catch {
      // Non-critical — best-effort
    }
  };

  // ── Reset ──────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setProposal(null);
    setError(null);
    setOrderId(null);
    setAppState('idle');
  };

  // ── Render: Order confirmation ─────────────────────────────────────────────
  if (appState === 'confirmed' && orderId) {
    return (
      <div className="home-wrapper">
        <Header />
        <main className="home-main">
          <OrderConfirm
            orderId={orderId}
            total={orderTotal}
            itemCount={orderItemCount}
            onBack={handleReset}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      <Header />

      <main className="home-main">
        {/* ── Intent bar ─────────────────────────────────────────── */}
        <section className="intent-section">
          <IntentBar
            onSubmit={handleIntentSubmit}
            isLoading={appState === 'loading'}
          />

          {/* Example prompts (idle) */}
          {appState === 'idle' && (
            <div className="example-prompts">
              <span className="example-prompts-label">Try:</span>
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="example-chip"
                  onClick={() => handleIntentSubmit(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Error ──────────────────────────────────────────────── */}
        {error && (
          <div className="error-banner" role="alert">
            <span>⚠️ {error}</span>
            <button onClick={handleReset} className="error-dismiss">Dismiss</button>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────── */}
        {appState === 'loading' && <LoadingState hasImage={hasImage} />}

        {/* ── Cart result ────────────────────────────────────────── */}
        {(appState === 'result' || appState === 'confirming') && proposal && (
          <section className="result-section">
            {/* Reset / try again */}
            <div className="result-toolbar">
              <button className="result-reset-btn" onClick={handleReset} id="new-search-btn">
                <RefreshCw size={14} /> New search
              </button>
            </div>

            <CartProposalCard
              proposal={proposal}
              onCheckout={handleCheckout}
              isCheckingOut={appState === 'confirming'}
              onFeedbackRemove={handleFeedbackRemove}
            />
          </section>
        )}

        {/* ── Idle hero ─────────────────────────────────────────── */}
        {appState === 'idle' && (
          <section className="idle-hero">
            <div className="idle-hero-steps">
              {[
                { n: '1', icon: '💬', label: 'Tell us your need' },
                { n: '2', icon: '🤖', label: 'Agent builds the cart' },
                { n: '3', icon: '✅', label: 'One tap to buy' },
              ].map((s) => (
                <div key={s.n} className="idle-step">
                  <div className="idle-step-icon">{s.icon}</div>
                  <p className="idle-step-label">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="idle-trust-line">
              <Sparkles size={14} />
              Every item comes with a reason — no blind picks
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function Header() {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <div className="app-logo">
          <div className="app-logo-mark">
            <span>a</span>
          </div>
          <div className="app-logo-text">
            <span className="logo-amazon">amazon</span>
            <span className="logo-now"> now</span>
          </div>
        </div>
        <p className="app-tagline">Delivery is fast. Now shopping is too.</p>
      </div>
    </header>
  );
}
