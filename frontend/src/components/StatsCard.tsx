import React from 'react';
import { Users, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import './StatsCard.css';

const iconMap = {
  users: Users,
  dollar: DollarSign,
  deals: ShoppingBag,
  chart: TrendingUp,
};

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  icon: keyof typeof iconMap;
}

const StatsCard = ({ title, value, change, icon }: StatsCardProps) => {
  const IconComponent = iconMap[icon];
  const isPositive = change.startsWith('+');

  return (
    <div className="stats-card">
      <div className="stats-card-header">
        <h3>{title}</h3>
        <div className="stats-icon">
          <IconComponent size={24} />
        </div>
      </div>
      <div className="stats-value">{value}</div>
      <div className="stats-change">
        <span className={isPositive ? 'positive' : 'negative'}>
          {change}
        </span>
        <span>from last month</span>
      </div>
    </div>
  );
};

export default StatsCard;