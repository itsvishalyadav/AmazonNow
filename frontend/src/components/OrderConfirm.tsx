import { useState, useEffect } from 'react';
import { Package, MapPin, Navigation, Map } from 'lucide-react';

interface OrderConfirmProps {
  orderId: string;
  total: number;
  itemCount: number;
  onBack: () => void;
}

export default function OrderConfirm({ orderId, total, itemCount, onBack }: OrderConfirmProps) {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
      
      {/* ── Radar / Map Animation Container ─────────────────────── */}
      <div className="relative w-64 h-64 mb-8 rounded-full border border-white/10 bg-[#131A22] shadow-[0_0_50px_rgba(0,168,225,0.15)] overflow-hidden flex items-center justify-center">
        
        {/* Subtle grid pattern for "map" feel */}
        <div className="absolute inset-0 opacity-20" style={{ 
          backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {/* Pulsing rings (Radar effect) */}
        <div className="absolute w-full h-full rounded-full border border-[#00A8E1]/30 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute w-3/4 h-3/4 rounded-full border border-[#00A8E1]/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_1s]" />
        <div className="absolute w-2/4 h-2/4 rounded-full border border-[#00A8E1]/10 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite_2s]" />

        {/* Home Base (Center) */}
        <div className="absolute z-10 w-12 h-12 bg-[#00A8E1]/20 rounded-full flex items-center justify-center backdrop-blur-md border border-[#00A8E1]/50 shadow-[0_0_15px_#00A8E1]">
          <MapPin size={24} className="text-[#00A8E1]" />
        </div>

        {/* Approaching Drone / Rider */}
        <div className="absolute z-20 top-8 right-8 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="w-10 h-10 bg-amazon-orange rounded-full flex items-center justify-center shadow-[0_0_20px_var(--amazon-orange)]">
            <Navigation size={20} className="text-black transform -rotate-45" strokeWidth={3} />
          </div>
          <div className="w-2 h-2 bg-amazon-orange rounded-full absolute -bottom-4 left-4 animate-ping" />
        </div>
      </div>

      {/* ── Delivery Text ─────────────────────────────────────────── */}
      <h2 className="text-[28px] font-black tracking-tight text-white mb-2">
        Arriving in <span className="text-amazon-orange">{mins}:{secs.toString().padStart(2, '0')}</span>
      </h2>
      <p className="text-gray-400 font-medium mb-8">
        Your {itemCount} item{itemCount !== 1 ? 's' : ''} are on the way.
      </p>

      {/* ── Order Details Card ────────────────────────────────────── */}
      <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 mb-8 text-left backdrop-blur-md">
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Package size={20} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Order ID</div>
              <div className="text-[14px] font-mono text-white/90">{orderId}</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Total Paid</div>
            <div className="text-[18px] font-black text-white">₹{total}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Status</div>
            <div className="text-[14px] font-bold text-amazon-success flex items-center gap-1.5 justify-end">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amazon-success opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amazon-success"></span>
              </span>
              In Transit
            </div>
          </div>
        </div>
      </div>

      {/* ── Back button ───────────────────────────────────────────── */}
      <button 
        onClick={onBack}
        className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold transition-all flex items-center gap-2"
      >
        <Map size={18} />
        Back to Shopping
      </button>

    </div>
  );
}
