import { useState, useEffect } from 'react';
import Home from './pages/Home';
import PurchaseHistory from './pages/PurchaseHistory';
import GlobalCart from './components/GlobalCart';
import Navbar from './components/Navbar';
import ProductOverlay from './components/ProductOverlay';
import { useCart } from './context/CartContext';
import { Sparkles } from 'lucide-react';
import ToastContainer from './components/Toast';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'cart'>('home');
  const { selectedProduct, setSelectedProduct } = useCart();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="app-layout">
      <ToastContainer />
      <Navbar theme={theme} toggleTheme={toggleTheme} onNavClick={setActiveTab} />
      
      <div className={`pt-4 pb-2 flex justify-center ${theme === 'light' ? 'bg-[#eaeded]' : 'bg-[var(--amazon-navy)]'}`}>
        <button 
          className="group relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-b from-[#131921] to-[#0f1111] px-8 py-3 font-bold text-white shadow-[0_4px_14px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(255,153,0,0.15)] border border-white/10 hover:border-[#ff9900]/50"
          onClick={() => setActiveTab('home')}
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
          <Sparkles size={20} className="text-[#ff9900]" />
          <span className="tracking-wide text-[15px]">Ask Now Agent</span>
        </button>
      </div>

      <main className="main-content flex-1">
        {activeTab === 'home' && <Home />}
        {activeTab === 'history' && <PurchaseHistory />}
        {activeTab === 'cart' && <GlobalCart />}
      </main>

      {/* Global Product Overlay */}
      {selectedProduct && <ProductOverlay item={selectedProduct} onClose={() => setSelectedProduct(null)} />}
    </div>
  );
}

export default App;
