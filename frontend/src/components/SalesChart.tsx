import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './SalesChart.css';

const data = [
  { name: 'Jan', sales: 4000 },
  { name: 'Feb', sales: 3000 },
  { name: 'Mar', sales: 5000 },
  { name: 'Apr', sales: 4780 },
  { name: 'May', sales: 5890 },
  { name: 'Jun', sales: 6390 },
  { name: 'Jul', sales: 7490 },
];

const SalesChart = () => {
  return (
    <div className="sales-chart">
      <div className="chart-header">
        <h3>Sales Overview</h3>
        <select className="chart-select">
          <option>Last 7 months</option>
          <option>Last 30 days</option>
          <option>Last year</option>
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffe0e7" />
          <XAxis dataKey="name" stroke="#ff99aa" />
          <YAxis stroke="#ff99aa" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#fff', 
              border: '1px solid #ffb6c1',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="#ff69b4" 
            strokeWidth={2}
            dot={{ fill: '#ff69b4', r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SalesChart;