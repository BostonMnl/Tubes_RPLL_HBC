import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  FileText, 
  Settings, 
  HelpCircle,
  BarChart3,
  Target
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', active: true },
    { icon: Users, label: 'Customers' },
    { icon: ShoppingBag, label: 'Deals' },
    { icon: Target, label: 'Leads' },
    { icon: BarChart3, label: 'Analytics' },
    { icon: FileText, label: 'Reports' },
    { icon: Settings, label: 'Settings' },
    { icon: HelpCircle, label: 'Help' },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        <div className="logo-icon">CRM</div>
        <h2>PinkCRM</h2>
      </div>
      <nav className="nav-menu">
        {menuItems.map((item, index) => (
          <a 
            key={index} 
            href="#" 
            className={`nav-item ${item.active ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;