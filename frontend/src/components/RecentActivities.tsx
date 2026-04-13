import React from 'react';
import { UserPlus, ShoppingBag, DollarSign, MessageCircle } from 'lucide-react';
import './RecentActivities.css';

const activities = [
  { icon: UserPlus, text: 'New customer registered', time: '2 minutes ago', color: '#ff69b4' },
  { icon: ShoppingBag, text: 'Deal closed: Premium Package', time: '1 hour ago', color: '#ff99aa' },
  { icon: DollarSign, text: 'Payment received from Tech Corp', time: '3 hours ago', color: '#ffb6c1' },
  { icon: MessageCircle, text: 'New support ticket opened', time: '5 hours ago', color: '#ffc0cb' },
];

const RecentActivities = () => {
  return (
    <div className="recent-activities">
      <div className="activities-header">
        <h3>Recent Activities</h3>
        <a href="#" className="view-all">View All</a>
      </div>
      <div className="activities-list">
        {activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-icon" style={{ backgroundColor: activity.color }}>
              <activity.icon size={16} />
            </div>
            <div className="activity-details">
              <p>{activity.text}</p>
              <span>{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivities;