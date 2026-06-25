import { useEffect, useState } from 'react';

export default function LoadingState({ hasImage }: { hasImage?: boolean }) {
  const baseSteps = [
    'Parsing your request...',
    'Searching the Amazon catalog...',
    'Finding the best options...',
    'Applying Prime delivery...',
    'Finalising your cart...'
  ];
  
  const STEPS = hasImage 
    ? ['Analyzing your image...', ...baseSteps] 
    : baseSteps;

  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => {
        if (i >= STEPS.length - 1) {
          clearInterval(interval);
          return i;
        }
        return i + 1;
      });
    }, 1500); // 1.5s per step
    return () => clearInterval(interval);
  }, [STEPS.length]);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center min-h-[400px] bg-[var(--amazon-bg)] rounded-2xl border border-[var(--amazon-border)] shadow-sm">
      
      {/* Circular Video Container with Animated Ring */}
      <div className="relative w-[180px] h-[180px] mb-10 flex items-center justify-center">
        {/* Background track ring */}
        <div className="absolute inset-[-6px] rounded-full border-[4px] border-[var(--amazon-border)]" />
        {/* Spinning glowing ring */}
        <div className="absolute inset-[-6px] rounded-full border-[4px] border-transparent border-t-[#FF9900] spin" style={{ filter: 'drop-shadow(0 0 6px rgba(255,153,0,0.6))' }} />
        
        {/* Video itself */}
        <div className="relative w-full h-full rounded-full overflow-hidden bg-white shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex items-center justify-center">
          <video 
            src="/Shopping Cart Loader.mp4" 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover mix-blend-multiply scale-[1.2]" 
          />
        </div>
      </div>

      {/* Step Text with Fade Up Animation */}
      <div className="h-[32px] overflow-hidden mb-5 flex items-center justify-center">
        <h3 key={stepIdx} className="text-[20px] font-bold text-[var(--amazon-text)] fade-up leading-none m-0">
          {STEPS[stepIdx]}
        </h3>
      </div>

      {/* Progress Dots */}
      <div className="flex items-center gap-3 mb-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              i === stepIdx 
                ? 'bg-[#FF9900] scale-125' 
                : i < stepIdx 
                  ? 'bg-[#007185]' 
                  : 'bg-[var(--amazon-border)]'
            }`}
          />
        ))}
      </div>

      <p className="text-[14px] text-[var(--amazon-text-dim)]">
        The Amazon Now Agent is thinking...
      </p>
    </div>
  );
}
