import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

interface SwipeCheckoutButtonProps {
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  text?: string;
}

export default function SwipeCheckoutButton({ 
  onConfirm, 
  disabled = false, 
  isLoading = false,
  text = "Swipe to order" 
}: SwipeCheckoutButtonProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);

  // Maximum drag distance
  const maxDrag = containerRef.current && thumbRef.current
    ? containerRef.current.offsetWidth - thumbRef.current.offsetWidth - 8 // 4px padding on each side
    : 0;

  // Handle pointer down (mouse or touch)
  const handlePointerDown = (e: React.PointerEvent) => {
    if (disabled || isLoading || isSuccess) return;
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  // Handle pointer move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || disabled || isLoading || isSuccess) return;
    
    // Calculate new position
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // e.clientX is the current pointer position
    // We want the thumb center to follow the pointer, bounded by 0 and maxDrag
    let newX = e.clientX - containerRect.left - (thumbRef.current?.offsetWidth || 0) / 2;
    
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;
    
    setDragX(newX);
  };

  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);

    // If dragged more than 90%, confirm!
    if (maxDrag > 0 && dragX > maxDrag * 0.9) {
      setDragX(maxDrag);
      setIsSuccess(true);
      onConfirm();
    } else {
      // Snap back
      setDragX(0);
    }
  };

  // Reset success state if isLoading becomes true and then false
  useEffect(() => {
    if (!isLoading && isSuccess) {
      // Wait a moment then snap back (if the component isn't unmounted)
      const timer = setTimeout(() => {
        setDragX(0);
        setIsSuccess(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isSuccess]);

  const progressPct = maxDrag > 0 ? dragX / maxDrag : 0;

  return (
    <div 
      ref={containerRef}
      className={`relative h-14 rounded-full flex items-center px-1 overflow-hidden transition-colors duration-300 ${
        disabled 
          ? 'bg-white/5 opacity-50 cursor-not-allowed' 
          : isSuccess 
            ? 'bg-amazon-success/20 border border-amazon-success/50' 
            : 'bg-white/10 border border-white/20'
      }`}
      style={{
        boxShadow: isSuccess ? '0 0 20px rgba(52, 211, 153, 0.2) inset' : 'none',
        touchAction: 'none' // Prevent scrolling while swiping
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Background fill based on progress */}
      <div 
        className="absolute left-0 top-0 bottom-0 bg-amazon-orange/20 transition-opacity"
        style={{ width: `${(progressPct * 100) + 10}%`, opacity: isSuccess ? 0 : 1 }}
      />

      {/* Text Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <span className={`font-bold text-[15px] transition-all duration-300 ${
          isSuccess ? 'text-amazon-success scale-105' : 'text-white/80'
        }`}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} /> Processing...
            </span>
          ) : isSuccess ? (
            'Order Confirmed!'
          ) : (
            <span style={{ opacity: 1 - progressPct }}>{text}</span>
          )}
        </span>
      </div>

      {/* Draggable Thumb */}
      <div
        ref={thumbRef}
        onPointerDown={handlePointerDown}
        className={`absolute w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-all z-10 ${
          disabled ? 'bg-white/20' : 
          isSuccess ? 'bg-amazon-success text-black' : 
          isLoading ? 'bg-amazon-orange/50 text-white/50' :
          'bg-[#f97316] text-black cursor-grab active:cursor-grabbing hover:scale-105'
        }`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {isSuccess ? <Check size={24} strokeWidth={3} /> : <ArrowRight size={20} strokeWidth={2.5} />}
      </div>
    </div>
  );
}
