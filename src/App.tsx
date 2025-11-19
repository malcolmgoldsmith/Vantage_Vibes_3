import React, { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
export function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">
      <Sidebar open={sidebarOpen} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-y-auto p-4">
          <Dashboard />
        </main>
      </div>
    </div>;
}