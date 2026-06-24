import { useState, useEffect } from 'react';
import Home from './pages/Home';
import PurchaseHistory from './pages/PurchaseHistory';
import Navbar from './components/Navbar';
import { Sparkles, Clock } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');
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
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      
      {/* Premium Segmented Tab Bar */}
      <div className="tab-container-wrapper">
        <div className="segmented-control">
          <button 
            className={`segment-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <Sparkles size={16} className="segment-icon" />
            <span>AI Agent</span>
          </button>
          <button 
            className={`segment-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} className="segment-icon" />
            <span>Orders</span>
          </button>
          {/* Animated background pill */}
          <div className="segment-indicator" style={{ transform: `translateX(${activeTab === 'home' ? '0%' : '100%'})` }} />
        </div>
      </div>

      <main className="main-content">
        {activeTab === 'home' ? <Home /> : <PurchaseHistory />}
      </main>
    </div>
  );
}

export default App;
