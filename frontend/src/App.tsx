import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";
import SalesChart from "./components/SalesChart";
import TopProducts from "./components/TopProducts";
import RecentActivities from "./components/RecentActivities";
import "./App.css";

function App() {
  return (
    <div className="app">
      <Sidebar />

      <div className="main">
        <Header />

        <div className="content">
          <h1 className="title">Dashboard</h1>

          <div className="stats-grid">
            <StatsCard title="Total Users" value="1,240" change="+12%" icon="users" />
            <StatsCard title="Revenue" value="$34,500" change="+8%" icon="dollar" />
            <StatsCard title="Deals" value="320" change="-3%" icon="deals" />
            <StatsCard title="Growth" value="18%" change="+5%" icon="chart" />
          </div>

          <div className="grid-2">
            <SalesChart />
            <RecentActivities />
          </div>

          <TopProducts />
        </div>
      </div>
    </div>
  );
}

export default App;