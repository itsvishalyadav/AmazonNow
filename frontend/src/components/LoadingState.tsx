// frontend/src/components/LoadingState.tsx
// Animated loading state shown while the Now Agent assembles a cart.
// Shows a multi-step progress animation with elapsed timer.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react';

const STEPS = [
  { icon: '🧠', text: 'Understanding your need…' },
  { icon: '🔍', text: 'Finding products…' },
  { icon: '⚖️',  text: 'Selecting best picks…' },
  { icon: '💰', text: 'Checking budget…' },
  { icon: '✨', text: 'Assembling cart…' },
];

export default function LoadingState() {
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  // Step animation
  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => (i + 1) % STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  // Elapsed timer (updates every second)
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
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

      {/* Elapsed timer */}
      <p className="loading-subtitle">
        {elapsed < 15
          ? `Building your cart… ${elapsed}s`
          : elapsed < 30
            ? `Taking a bit longer… ${elapsed}s`
            : `Almost there — hang tight! ${elapsed}s`}
      </p>
    </div>
  );
}
