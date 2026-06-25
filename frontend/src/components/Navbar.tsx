import { useState, useEffect, useRef } from 'react';
import { MapPin, User, ChevronDown, Sparkles, LogOut, Settings, CreditCard, Check, Moon, Sun, Search, ShoppingCart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { postSearchItems } from '../lib/api';
import type { CartItem } from '../lib/types';

export default function Navbar({ theme, toggleTheme, onNavClick }: { theme?: 'dark' | 'light', toggleTheme?: () => void, onNavClick?: (tab: 'home' | 'history' | 'cart') => void }) {
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [selectedCity, setSelectedCity] = useState("Mumbai 400001");
  const { globalCartCount, addToGlobalCart } = useCart();

  // Search logic
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<CartItem[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await postSearchItems({ query: searchQuery, topK: 5 });
        setSearchResults(res.items || []);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const CITIES = [
    "Mumbai 400001",
    "Delhi 110001",
    "Bangalore 560001",
    "Hyderabad 500001",
    "Chennai 600001"
  ];

  return (
    <header className="bg-[var(--amazon-navy)] text-white sticky top-0 z-50">
      <div className="max-w-[1500px] mx-auto px-2 lg:px-4 py-2 flex items-center gap-4">
        {/* Left: Brand */}
        <div 
          className="flex items-center gap-1.5 cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm transition-all h-[40px]"
          onClick={() => onNavClick?.('home')}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF9900" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mb-0.5">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#FF9900" fillOpacity="0.2" />
          </svg>
          <div className="flex items-baseline tracking-tight leading-none text-white">
            <span className="text-[22px] font-bold">amazon</span>
            <span className="text-[22px] font-medium text-[#FF9900] ml-1">now</span>
          </div>
        </div>

        {/* Center: Delivery Location */}
        <div className="relative hidden md:block">
          <div 
            className="flex items-end hover:outline hover:outline-1 hover:outline-white p-1.5 rounded-sm cursor-pointer h-[40px]"
            onClick={() => { setShowLocationMenu(!showLocationMenu); setShowProfileMenu(false); }}
          >
            <MapPin size={18} className="text-white mb-0.5 mr-1" />
            <div className="flex flex-col">
              <span className="text-[12px] text-[#ccc] leading-none mb-0.5">Delivering to {selectedCity.split(' ')[0]}</span>
              <span className="text-[14px] font-bold leading-none">Update location</span>
            </div>
          </div>

          {/* Location Dropdown */}
          {showLocationMenu && (
            <div className="absolute top-full mt-1 left-0 w-56 bg-white text-black border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50">
              <div className="bg-gray-100 p-3 border-b border-gray-300">
                <p className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">Choose Location</p>
              </div>
              <ul className="py-2 flex flex-col gap-1 px-2">
                {CITIES.map(city => (
                  <li 
                    key={city}
                    className="px-3 py-2 text-[13px] rounded cursor-pointer flex items-center justify-between hover:bg-gray-100 transition-colors"
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

        {/* Center: Search Bar */}
        <div className="flex-1 flex" ref={searchRef}>
          <div className="relative flex-1 flex bg-white rounded-md overflow-hidden focus-within:ring-2 focus-within:ring-amazon-orange h-[40px]">
            <button className="bg-gray-100 hover:bg-gray-200 border-r border-gray-300 px-3 text-[13px] text-gray-600 font-medium flex items-center gap-1 focus:outline-none">
              All <ChevronDown size={14} />
            </button>
            <input 
              type="text" 
              placeholder="Search Amazon Now" 
              className="flex-1 text-black px-3 outline-none text-[15px]"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
            />
            <button className="bg-[#FEBD69] hover:bg-[#F3A847] px-4 flex items-center justify-center focus:outline-none transition-colors">
              <Search size={20} className="text-gray-900" />
            </button>
          </div>
          
          {/* Search Dropdown Overlay */}
          {isSearching && searchResults.length > 0 && (
            <div className="absolute top-[52px] w-[50%] max-w-[800px] bg-white text-black rounded-b-md shadow-2xl border-t border-gray-200 z-50 flex flex-col">
              {searchResults.map((item) => (
                <div key={item.productId} className="flex items-center gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-12 h-12 object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                      <ShoppingCart size={20} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-medium text-gray-900 truncate">{item.name}</h4>
                    <p className="text-[12px] text-gray-500">{item.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[15px] font-bold text-gray-900">₹{item.price}</span>
                    <button 
                      onClick={() => {
                        addToGlobalCart({ ...item, qty: 1 });
                        setIsSearching(false);
                        setSearchQuery('');
                      }}
                      className="bg-[#FFD814] hover:bg-[#F7CA00] text-black text-[11px] font-medium px-3 py-1 rounded-full shadow-sm active:scale-95 transition-all"
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Profile & Theme Toggle */}
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="hover:outline hover:outline-1 hover:outline-white p-2 rounded-sm transition-all h-[40px] flex items-center justify-center"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="relative">
            <div 
              className="hover:outline hover:outline-1 hover:outline-white p-1.5 rounded-sm cursor-pointer h-[40px] flex flex-col justify-center"
              onClick={() => { setShowProfileMenu(!showProfileMenu); setShowLocationMenu(false); }}
            >
              <span className="text-[12px] leading-none text-white">Hello, Priya</span>
              <span className="text-[14px] font-bold leading-none flex items-center">Account & Lists <ChevronDown size={14} className="ml-1 text-gray-400" /></span>
            </div>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute top-full mt-1 right-0 w-64 bg-white text-black border border-gray-300 rounded-lg shadow-xl overflow-hidden z-50">
                <div className="bg-gray-100 p-4 border-b border-gray-300">
                  <p className="text-[15px] font-bold">Priya Sharma</p>
                  <p className="text-[12px] text-gray-600">priya.sharma@example.com</p>
                </div>
                <ul className="py-2">
                  <li className="px-4 py-2 text-[13px] hover:text-amazon-orange cursor-pointer transition-colors">Your Account</li>
                  <li className="px-4 py-2 text-[13px] hover:text-amazon-orange cursor-pointer transition-colors" onClick={() => onNavClick?.('history')}>Your Orders</li>
                  <li className="px-4 py-2 text-[13px] hover:text-amazon-orange cursor-pointer transition-colors">Your Wish List</li>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <li className="px-4 py-2 text-[13px] text-red-600 hover:text-red-700 font-medium cursor-pointer transition-colors">Sign Out</li>
                </ul>
              </div>
            )}
          </div>
          
          <div 
            className="hover:outline hover:outline-1 hover:outline-white p-1.5 rounded-sm cursor-pointer h-[40px] flex flex-col justify-center"
            onClick={() => onNavClick?.('history')}
          >
            <span className="text-[12px] leading-none text-white">Returns</span>
            <span className="text-[14px] font-bold leading-none">& Orders</span>
          </div>

          <div 
            className="hover:outline hover:outline-1 hover:outline-white p-1.5 rounded-sm cursor-pointer h-[40px] flex items-end relative ml-2"
            onClick={() => onNavClick?.('cart')}
          >
            <div className="relative">
              <ShoppingCart size={32} />
              <span className="absolute top-[-5px] left-[13px] text-[#F3A847] font-bold text-[16px] leading-none">
                {globalCartCount}
              </span>
            </div>
            <span className="text-[14px] font-bold leading-none mb-1 ml-1 hidden sm:block">Cart</span>
          </div>
        </div>
      </div>
      
      {/* Bottom Nav bar (Categories) */}
      <div className="bg-[#232f3e] text-white px-4 py-1.5 flex items-center gap-4 overflow-x-auto whitespace-nowrap hide-scrollbar text-[14px] font-medium">
        <div className="flex items-center gap-1 cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm"><span className="font-bold">☰ All</span></div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">Fresh</div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">Amazon Pay</div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">Gift Cards</div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">Buy Again</div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">AmazonBasics</div>
        <div className="cursor-pointer hover:outline hover:outline-1 hover:outline-white p-1 rounded-sm">Health, Household & Personal Care</div>
      </div>
    </header>
  );
}
