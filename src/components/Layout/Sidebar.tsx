import React from 'react';
import { Home, Settings, Power, Target, Grid, Shield, Wrench, Sparkles, ShieldCheck, ExternalLink, Lock, Zap, MessageSquare } from 'lucide-react';

type Page = 'dashboard' | 'settings' | 'apps' | 'test' | 'chat' | 'hello';

interface SidebarProps {
  open: boolean;
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  open,
  currentPage,
  onNavigate
}) => {
  const sidebarItems = [{
    icon: <Home size={20} />,
    page: 'dashboard' as Page,
    id: 'home'
  }, {
    icon: <Settings size={20} />,
    page: undefined,
    id: 'settings-icon'
  }, {
    icon: <Power size={20} />,
    page: undefined,
    id: 'power'
  }, {
    icon: <Target size={20} />,
    page: 'hello' as Page,
    id: 'target'
  }, {
    icon: <Grid size={20} />,
    page: undefined,
    id: 'grid'
  }, {
    icon: <Shield size={20} />,
    page: undefined,
    id: 'shield'
  }, {
    icon: <Wrench size={20} />,
    page: 'settings' as Page,
    id: 'wrench'
  }, {
    icon: <Sparkles size={20} />,
    page: 'apps' as Page,
    id: 'sparkles'
  }, {
    icon: <Zap size={20} />,
    page: 'test' as Page,
    id: 'test'
  }, {
    icon: <div className="w-8 h-px bg-gray-200" />,
    separator: true,
    id: 'separator'
  }, {
    icon: <ShieldCheck size={20} />,
    page: undefined,
    id: 'shieldcheck'
  }, {
    icon: <ExternalLink size={20} />,
    page: undefined,
    id: 'external'
  }, {
    icon: <Lock size={20} />,
    page: undefined,
    id: 'lock'
  }, {
    icon: <MessageSquare size={20} />,
    page: 'chat' as Page,
    id: 'chat'
  }];

  return <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${open ? 'w-16' : 'w-0'}`}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="bg-[#0072CE] text-white font-bold w-10 h-10 flex items-center justify-center rounded">
          L
        </div>
      </div>
      <div className="flex-1 py-4">
        {sidebarItems.map((item) => <div
            key={item.id}
            onClick={() => item.page && onNavigate(item.page)}
            className={`w-full h-12 flex items-center justify-center ${item.page ? 'cursor-pointer' : 'cursor-default'} text-gray-600 hover:text-blue-600 ${item.page === currentPage ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'} ${item.separator ? 'cursor-default hover:text-gray-600' : ''}`}>
            {item.icon}
          </div>)}
      </div>
    </div>;
};