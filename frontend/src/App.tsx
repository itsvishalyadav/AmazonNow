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
          className="flex items-center gap-2 bg-[#FFD814] hover:bg-[#F7CA00] text-black px-6 py-2 rounded-full font-bold shadow-[0_2px_5px_0_rgba(213,217,217,.5)] transition-colors border border-[#FCD200]"
          onClick={() => setActiveTab('home')}
        >
          <Sparkles size={18} />
          <span>Now Agent</span>
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
