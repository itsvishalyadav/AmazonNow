import { useState } from 'react';
import { MapPin, User, ChevronDown, Sparkles, LogOut, Settings, CreditCard, Check } from 'lucide-react';

export default function Navbar() {
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Mumbai 400001");

  const CITIES = [
    "Mumbai 400001",
    "Delhi 110001",
    "Bangalore 560001",
    "Hyderabad 500001",
    "Chennai 600001"
  ];

  return (
    <header className="navbar-container">
      <div className="navbar-inner relative">
        {/* Left: Brand */}
        <div className="flex items-center gap-1.5 cursor-pointer transition-opacity hover:opacity-80">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FF9900" fillOpacity="0.2" />
          </svg>
          <div className="flex items-baseline tracking-tight leading-none">
            <span className="text-[22px] font-extrabold text-white">amazon</span>
            <span className="text-[22px] font-medium text-[#FF9900] ml-1">now</span>
          </div>
        </div>

        {/* Center: Delivery Location (Pill) */}
        <div className="relative">
          <div 
            className="navbar-delivery glass-pill cursor-pointer"
            onClick={() => { setShowLocationMenu(!showLocationMenu); setShowProfileMenu(false); }}
          >
            <MapPin size={14} className="text-amazon-orange" />
            <div className="delivery-text">
              <span className="delivery-location">Deliver to Priya, {selectedCity}</span>
            </div>
            <ChevronDown size={14} className="text-gray-400 ml-1" />
          </div>

          {/* Location Dropdown Menu */}
          {showLocationMenu && (
            <div className="absolute top-full mt-3 left-0 w-56 bg-[#131A22]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50 fade-up">
              <div className="p-4 border-b border-white/5 bg-white/5">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">Choose Location</p>
              </div>
              <ul className="py-2 flex flex-col gap-1 px-2">
                {CITIES.map(city => (
                  <li 
                    key={city}
                    className={`px-3 py-2.5 text-[13px] rounded-lg cursor-pointer flex items-center justify-between transition-colors ${
                      selectedCity === city 
                        ? 'bg-amazon-orange/10 text-amazon-orange font-semibold' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                    onClick={() => {
                      setSelectedCity(city);
                      setShowLocationMenu(false);
                    }}
                  >
                    {city}
                    {selectedCity === city && <Check size={14} className="text-amazon-orange" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Profile */}
        <div className="relative">
          <div 
            className="navbar-profile cursor-pointer"
            onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLocationMenu(false); }}
          >
            <div className="profile-badge-premium hidden sm:flex">
              <Sparkles size={12} className="text-amazon-orange mr-1" />
              <span>Prime</span>
            </div>
            <div className="profile-avatar glass-avatar">
              <User size={18} className="text-white" />
            </div>
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute top-full mt-3 right-0 w-64 bg-[#131A22]/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden z-50 fade-up">
              <div className="p-5 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amazon-orange to-yellow-400 flex items-center justify-center text-[#131A22] font-black text-xl shadow-lg ring-2 ring-amazon-orange/30">
                    P
                  </div>
                  <div>
                    <p className="text-[15px] font-bold text-white tracking-wide">Priya Sharma</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">priya.sharma@example.com</p>
                  </div>
                </div>
              </div>
              <ul className="py-2 flex flex-col gap-1 px-2">
                <li className="px-3 py-2.5 text-[13px] font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer flex items-center gap-3 transition-colors">
                  <User size={16} className="text-gray-400" /> My Profile
                </li>
                <li className="px-3 py-2.5 text-[13px] font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer flex items-center gap-3 transition-colors">
                  <CreditCard size={16} className="text-gray-400" /> Payment Methods
                </li>
                <li className="px-3 py-2.5 text-[13px] font-medium text-gray-300 hover:bg-white/5 hover:text-white rounded-lg cursor-pointer flex items-center gap-3 transition-colors">
                  <Settings size={16} className="text-gray-400" /> Account Settings
                </li>
                <div className="h-px bg-white/10 my-1 mx-2"></div>
                <li className="px-3 py-2.5 text-[13px] font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg cursor-pointer flex items-center gap-3 transition-colors">
                  <LogOut size={16} /> Sign Out
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
