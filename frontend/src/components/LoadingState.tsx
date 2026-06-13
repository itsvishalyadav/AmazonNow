// frontend/src/components/LoadingState.tsx
// Animated loading state shown while the Now Agent assembles a cart.
// Shows a multi-step progress animation with Amazon branding.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { BrainCircuit, Search, Layers, Calculator, Sparkles, Image as ImageIcon } from 'lucide-react';

export default function LoadingState({ hasImage }: { hasImage?: boolean }) {
  const baseSteps = [
    { icon: <BrainCircuit size={28} className="text-amazon-orange" />, text: 'Parsing your need…' },
    { icon: <Search size={28} className="text-amazon-orange" />, text: 'Searching catalog…' },
    { icon: <Layers size={28} className="text-amazon-orange" />,  text: 'Selecting best picks…' },
    { icon: <Calculator size={28} className="text-amazon-orange" />, text: 'Checking your budget…' },
    { icon: <Sparkles size={28} className="text-amazon-orange" />, text: 'Finalising your cart…' },
  ];
  
  const STEPS = hasImage 
    ? [{ icon: <ImageIcon size={28} className="text-amazon-orange" />, text: 'Analyzing your photo…' }, ...baseSteps] 
    : baseSteps;

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
