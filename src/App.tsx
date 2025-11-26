import React, { useState } from 'react';
import { Login } from './components/Auth/Login';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Settings } from './components/Settings/Settings';
import { VantageApps } from './components/VantageApps/VantageApps';
import { GeminiTest } from './components/Settings/GeminiTest';
import { Chat } from './components/Chat/Chat';
import { HelloWorld } from './components/HelloWorld/HelloWorld';

type Page = 'dashboard' | 'settings' | 'apps' | 'test' | 'chat' | 'hello';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return <div className="flex h-screen bg-[#f5f5f7] overflow-hidden">
      <Sidebar open={sidebarOpen} currentPage={currentPage} onNavigate={setCurrentPage} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className={`flex-1 overflow-y-auto ${currentPage === 'chat' ? 'p-0' : 'p-4'}`}>
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'settings' && <Settings />}
          {currentPage === 'apps' && <VantageApps />}
          {currentPage === 'test' && <GeminiTest />}
          {currentPage === 'chat' && <Chat />}
          {currentPage === 'hello' && <HelloWorld />}
        </main>
      </div>
    </div>;
}