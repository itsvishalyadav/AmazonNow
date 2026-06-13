// frontend/src/components/LoadingState.tsx
// Animated loading state shown while the Now Agent assembles a cart.
// Shows a multi-step progress animation with Amazon branding.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';

const STEPS = [
  { icon: '🧠', text: 'Parsing your need…' },
  { icon: '🔍', text: 'Searching catalog…' },
  { icon: '⚖️',  text: 'Selecting best picks…' },
  { icon: '💰', text: 'Checking your budget…' },
  { icon: '✨', text: 'Finalising your cart…' },
];

export default function LoadingState() {
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-state" role="status" aria-live="polite">
      {/* Pulsing ring */}
      <div className="loading-ring">
        <div className="loading-ring-inner">
          <span className="loading-step-icon">{STEPS[stepIdx].icon}</span>
        </div>
      </div>

      {/* Step text */}
      <p className="loading-step-text">{STEPS[stepIdx].text}</p>

      {/* Progress dots */}
      <div className="loading-dots">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`loading-dot ${i === stepIdx ? 'loading-dot--active' : i < stepIdx ? 'loading-dot--done' : ''}`}
          />
        ))}
      </div>

      <p className="loading-subtitle">
        The Now Agent is thinking… usually takes 3–8 s
      </p>
    </div>
  );
}
