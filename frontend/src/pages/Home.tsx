// frontend/src/pages/Home.tsx
// The main demo screen — IntentBar at top, CartProposalCard below.
// Handles the full intent → cart → checkout flow.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, MessageSquare, Bot, CheckCircle2, Calendar, X } from 'lucide-react';
import IntentBar from '../components/IntentBar';
import CartProposalCard from '../components/CartProposalCard';
import LoadingState from '../components/LoadingState';
import OrderConfirm from '../components/OrderConfirm';
import EmergencyChips from '../components/EmergencyChips';
import FeedbackToast from '../components/FeedbackToast';
import ProactiveBanner from '../components/ProactiveBanner';
import ReorderStrip from '../components/ReorderStrip';
import ProductOverlay from '../components/ProductOverlay';
import { postIntent, postCheckout, postFeedback, postEmergency, getProactive, postProactiveUpdate, getReorder, postDisconnectCalendar, getCalendarStatus } from '../lib/api';
import type { ProactiveSuggestion } from '../lib/api';
import type { CartProposal, CartItem } from '../lib/types';

const DEMO_USER_ID = 'user-demo-01';

const EXAMPLE_PROMPTS = [
  'high fever and body ache, need medicines',
  'tea, biscuits, and chips for evening snacks',
  'restock milk, bread, and eggs',
  'need new Samsung s24 Ultra',
  'maggi, cold drink, and some chocolate',
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
  const [activeEmergency, setActiveEmergency] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'avoid' | 'prefer' } | null>(null);

  // Phase 11 state
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [reorderCandidates, setReorderCandidates] = useState<CartItem[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CartItem | null>(null);
  const [isProactiveLoading, setIsProactiveLoading] = useState(true);
  const [isReorderLoading, setIsReorderLoading] = useState(true);
  const [promptsOffset, setPromptsOffset] = useState(0);

  // ── Fetch Signals on Mount (Phase 11) ──────────────────────────────────────
  useEffect(() => {
    // Check if calendar was just connected via OAuth redirect
    const params = new URLSearchParams(window.location.search);
    const calendarToken = params.get('calendarToken');
    if (calendarToken) {
      localStorage.setItem('amazon_now_calendar_token', calendarToken);
      setIsCalendarConnected(true);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      // Otherwise, ask backend for current status (which reads from localStorage header)
      // Added v=2 to bust browser CORS preflight cache
      getCalendarStatus(DEMO_USER_ID)
        .then(res => setIsCalendarConnected(res.connected))
        .catch(err => console.error('Calendar status fetch failed:', err));
    }

    // Phase 11: Call the proactive endpoint with cache buster for CORS preflight
    getProactive(DEMO_USER_ID)
      .then((data) => {
        if (data.suggestions && data.suggestions.length > 0) {
          setProactiveSuggestion(data.suggestions[0]);
        }
      })
      .catch((err) => {
        console.error('Proactive signal fetch failed:', err);
      })
      .finally(() => setIsProactiveLoading(false));

    getReorder(DEMO_USER_ID)
      .then(res => {
        if (res.candidates && res.candidates.length > 0) {
          setReorderCandidates(res.candidates);
        }
      })
      .catch((err) => {
        console.error('Reorder fetch failed:', err);
      })
      .finally(() => setIsReorderLoading(false));

    const promptTimer = setInterval(() => {
      setPromptsOffset(prev => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(promptTimer);
  }, []);

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

  // ── Remove/Add feedback ────────────────────────────────────────────────────
  const handleFeedbackRemove = async (productId: string, productName: string) => {
    try {
      await postFeedback({ userId: DEMO_USER_ID, removed: [productId] });
      setToast({ message: `✓ Got it — we'll avoid ${productName} in future carts`, type: 'avoid' });
    } catch {
      // Non-critical — best-effort
    }
  };

  const handleFeedbackAdd = async (productName: string) => {
    try {
      await postFeedback({ userId: DEMO_USER_ID, added: [productName] });
      setToast({ message: `✓ Noted — we'll prioritise ${productName} next time`, type: 'prefer' });
    } catch {
      // Non-critical
    }
  };

  // ── Emergency ─────────────────────────────────────────────────────────────
  const handleEmergency = async (scenario: string) => {
    setError(null);
    setProposal(null);
    setActiveEmergency(scenario);
    setAppState('loading');

    try {
      const result = await postEmergency({ userId: DEMO_USER_ID, scenario });
      setProposal(result);
      setAppState('result');
      setActiveEmergency(null);
    } catch (err: any) {
      setError(err.message ?? 'Emergency request failed.');
      setAppState('idle');
      setActiveEmergency(null);
    }
  };

  // ── Disconnect Calendar ────────────────────────────────────────────────────
  const handleDisconnectCalendar = async () => {
    try {
      await postDisconnectCalendar(DEMO_USER_ID);
      localStorage.removeItem('amazon_now_calendar_token');
      setIsCalendarConnected(false);
      setProactiveSuggestion(null); // Clear the calendar suggestion
    } catch (err) {
      console.error('Failed to disconnect calendar', err);
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
      <main className="home-main">
        {/* ── Intent bar ─────────────────────────────────────────── */}
        <section className="intent-section">
          <IntentBar
            onSubmit={handleIntentSubmit}
            isLoading={appState === 'loading'}
          />

          {/* Example prompts and Calendar Connect */}
          {appState === 'idle' && (
            <div className="flex flex-col sm:flex-row items-center justify-between mt-2 gap-4">
              <div className="example-prompts">
                <span className="example-prompts-label">Try:</span>
                {[0, 1, 2].map((i) => {
                  const p = EXAMPLE_PROMPTS[(promptsOffset + i) % EXAMPLE_PROMPTS.length];
                  return (
                    <button
                      key={p + promptsOffset}
                      className="example-chip animate-slideLeftFade"
                      onClick={() => handleIntentSubmit(p)}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
              
              {!isCalendarConnected ? (
                <button 
                  onClick={() => window.location.href = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:4001'}/api/auth/google`}
                  className="flex items-center gap-2 text-sm font-semibold bg-[#2a2a2a] text-white px-3 py-1.5 rounded-lg border border-white/10 hover:bg-[#333] transition-colors whitespace-nowrap"
                >
                  <Calendar size={16} className="text-blue-400" /> Connect Calendar
                </button>
              ) : (
                <div className="flex items-center gap-2 text-sm font-semibold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-lg border border-green-400/20 whitespace-nowrap">
                  <CheckCircle2 size={16} /> Calendar Sync Active
                  <button onClick={handleDisconnectCalendar} className="ml-2 hover:bg-green-400/20 p-1 rounded-full transition-colors" title="Disconnect Calendar">
                    <X size={14} className="text-green-500" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Phase 11: Proactive Banner (Suggested Box) */}
          {appState === 'idle' && (proactiveSuggestion || isProactiveLoading) && (
            <div className="mt-6 mb-2">
              <ProactiveBanner 
                suggestion={proactiveSuggestion} 
                isLoading={isProactiveLoading}
                onReview={() => {
                  if (proactiveSuggestion) {
                    setProposal(proactiveSuggestion.proposal);
                    setAppState('result');
                  }
                }}
                onDismiss={() => setProactiveSuggestion(null)}
                onSubmitAnswer={async (answer) => {
                  if (proactiveSuggestion) {
                    setIsProactiveLoading(true);
                    try {
                      const text = `Context from proactive event: "${proactiveSuggestion.signal}". You asked: "${proactiveSuggestion.proposal.clarifyingQuestion || ''}". User answers: "${answer}". Please generate the cart items.`;
                      const result = await postIntent({ userId: DEMO_USER_ID, text });
                      const updatedSuggestion = { ...proactiveSuggestion, proposal: result };
                      setProactiveSuggestion(updatedSuggestion);
                      await postProactiveUpdate(DEMO_USER_ID, updatedSuggestion);
                    } catch (err) {
                      console.error("Failed to answer proactive suggestion", err);
                    } finally {
                      setIsProactiveLoading(false);
                    }
                  }
                }}
              />
            </div>
          )}

          {/* Phase 11: Reorder Strip (Running Low) */}
          {appState === 'idle' && (reorderCandidates.length > 0 || isReorderLoading) && (
            <div className="mt-4 mb-2">
              <ReorderStrip 
                candidates={reorderCandidates}
                isLoading={isReorderLoading}
                onAppendToSearch={(productName) => {
                  const input = document.getElementById('intent-input') as HTMLTextAreaElement;
                  if (input) {
                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                    const newValue = input.value ? `${input.value}, ${productName}` : productName;
                    nativeInputValueSetter?.call(input, newValue);
                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    input.focus();
                  }
                }}
                onClickProduct={setSelectedProduct}
              />
            </div>
          )}
        </section>

        {/* ── Emergency Chips ────────────────────────────────────── */}
        {appState === 'idle' && (
          <EmergencyChips
            onSelect={handleEmergency}
            isLoading={activeEmergency !== null}
            activeScenario={activeEmergency}
          />
        )}

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
              onFeedbackAdd={handleFeedbackAdd}
              onReply={(text) => handleIntentSubmit(text)}
              onClickProduct={setSelectedProduct}
            />
          </section>
        )}

        {/* ── Idle hero ─────────────────────────────────────────── */}
        {appState === 'idle' && (
          <section className="idle-hero">
            <div className="idle-hero-steps">
              {[
                { n: '1', icon: <MessageSquare size={24} className="text-amazon-orange" />, label: 'Tell us your need' },
                { n: '2', icon: <Bot size={24} className="text-amazon-orange" />, label: 'Agent builds the cart' },
                { n: '3', icon: <CheckCircle2 size={24} className="text-amazon-orange" />, label: 'One tap to buy' },
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

        {/* ── Toast ──────────────────────────────────────────────── */}
        {toast && (
          <FeedbackToast
            message={toast.message}
            type={toast.type}
            onDismiss={() => setToast(null)}
          />
        )}

        {/* ── Product Overlay ────────────────────────────────────── */}
        {selectedProduct && (
          <ProductOverlay 
            item={selectedProduct} 
            onClose={() => setSelectedProduct(null)} 
          />
        )}
      </main>
    </div>
  );
}


