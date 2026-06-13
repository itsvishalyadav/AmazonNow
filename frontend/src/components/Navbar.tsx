import { MapPin, User, ChevronDown } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Left: Brand */}
        <div className="navbar-brand">
          <span className="logo-amazon">amazon</span>
          <span className="logo-now"> now</span>
        </div>

        {/* Center: Delivery Location */}
        <div className="navbar-delivery">
          <MapPin size={16} className="text-gray-400" />
          <div className="delivery-text">
            <span className="delivery-label">Deliver to Vishal</span>
            <span className="delivery-location">Mumbai 400001</span>
          </div>
        </div>

        {/* Right: Profile */}
        <div className="navbar-profile">
          <div className="profile-info">
            <span className="profile-greeting">Hello, Vishal</span>
            <span className="profile-badge">Prime</span>
          </div>
          <div className="profile-avatar">
            <User size={20} className="text-white" />
          </div>
          <ChevronDown size={14} className="text-gray-400 ml-1" />
        </div>
      </div>
    </header>
  );
}
