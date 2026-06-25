import { useEffect, useState } from 'react';

export const showToast = (message: string) => {
  const event = new CustomEvent('show-toast', { detail: message });
  window.dispatchEvent(event);
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<{id: number, msg: string}[]>([]);

  useEffect(() => {
    const handleToast = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      const id = Date.now();
      setToasts(prev => [...prev, { id, msg }]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 3000);
    };
    window.addEventListener('show-toast', handleToast);
    return () => window.removeEventListener('show-toast', handleToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="bg-[var(--amazon-navy)] text-white px-6 py-3 rounded-lg shadow-2xl border-t-4 border-[#FF9900] font-medium text-[15px] fade-up pointer-events-auto flex items-center gap-3">
          <div className="bg-[#146eb4] rounded-full p-1 border-2 border-white/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
