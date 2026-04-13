import React from 'react';
import Sidebar from './components/Sidebar'; // Sesuaikan path folder jika berbeda
import Header from './components/Header';
import StatsCard from './components/StatsCard';
import SalesChart from './components/SalesChart';
import RecentActivities from './components/RecentActivities';
import TopProducts from './components/TopProducts';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Header />
        <div className="dashboard-content">
          <div className="stats-grid">
            <StatsCard title="Total Request" value="12,453" change="+12.5%" icon="users" />
            <StatsCard title="Total Revenue" value="$89,234" change="+18.2%" icon="dollar" />
            <StatsCard title="Active Deals" value="456" change="-2.4%" icon="deals" />
            <StatsCard title="Conversion Rate" value="3.2%" change="+4.1%" icon="chart" />
          </div>

          <div className="charts-grid">
            <SalesChart />
            <div className="side-panels">
              <RecentActivities />
              <TopProducts />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;