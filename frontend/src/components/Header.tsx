import React from 'react';
import { Bell, Search, User, ChevronDown } from 'lucide-react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="search-bar">
        <Search size={20} />
        <input type="text" placeholder="Search customers, deals, or reports..." />
      </div>
      <div className="header-actions">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge">3</span>
        </button>
        <div className="user-menu">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <span className="user-name">Sarah Johnson</span>
            <span className="user-role">Admin</span>
          </div>
          <ChevronDown size={16} />
        </div>
      </div>
    </header>
  );
};

export default Header;