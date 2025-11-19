import React from 'react';
import { Home, Settings, Power, Target, Grid, Shield, Wrench, Sparkles, ShieldCheck, ExternalLink, Lock } from 'lucide-react';
interface SidebarProps {
  open: boolean;
}
export const Sidebar: React.FC<SidebarProps> = ({
  open
}) => {
  const sidebarItems = [{
    icon: <Home size={20} />,
    active: true
  }, {
    icon: <Settings size={20} />
  }, {
    icon: <Power size={20} />
  }, {
    icon: <Target size={20} />
  }, {
    icon: <Grid size={20} />
  }, {
    icon: <Shield size={20} />
  }, {
    icon: <Wrench size={20} />
  }, {
    icon: <Sparkles size={20} />
  }, {
    icon: <div className="w-8 h-px bg-gray-200" />,
    separator: true
  }, {
    icon: <ShieldCheck size={20} />
  }, {
    icon: <ExternalLink size={20} />
  }, {
    icon: <Lock size={20} />
  }];
  return <div className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${open ? 'w-16' : 'w-0'}`}>
      <div className="h-16 flex items-center justify-center border-b border-gray-200">
        <div className="bg-[#0072CE] text-white font-bold w-10 h-10 flex items-center justify-center rounded">
          L
        </div>
      </div>
      <div className="flex-1 py-4">
        {sidebarItems.map((item, index) => <div key={index} className={`w-full h-12 flex items-center justify-center cursor-pointer text-gray-600 hover:text-blue-600 ${item.active ? 'text-blue-600 bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'} ${item.separator ? 'cursor-default hover:text-gray-600' : ''}`}>
            {item.icon}
          </div>)}
      </div>
    </div>;
};