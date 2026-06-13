// frontend/src/App.tsx
import { useState } from 'react';
import Home from './pages/Home';
import PurchaseHistory from './pages/PurchaseHistory';
import Navbar from './components/Navbar';
import { Home as HomeIcon, Clock } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history'>('home');

  return (
    <div className="app-layout">
      <Navbar />
      
      {/* Top Tab Bar */}
      <div className="tab-bar-container">
        <div className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            <HomeIcon size={16} />
            <span>Agent</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            <span>Orders</span>
          </button>
        </div>
      </div>

      <main className="main-content">
        {activeTab === 'home' ? <Home /> : <PurchaseHistory />}
      </main>
    </div>
  );
}

export default App;
