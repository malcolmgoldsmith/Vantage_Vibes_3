import React from 'react';
import { Menu, Search, Bell, ShoppingCart, User } from 'lucide-react';
interface HeaderProps {
  onMenuToggle: () => void;
}
export const Header: React.FC<HeaderProps> = ({
  onMenuToggle
}) => {
  return <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4">
      <button className="mr-4 text-gray-600 hover:text-gray-900 focus:outline-none" onClick={onMenuToggle}>
        <Menu size={20} />
      </button>
      <div className="flex-1 mx-4 max-w-lg">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input type="text" className="bg-gray-100 border border-gray-200 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5" placeholder="Search..." />
        </div>
      </div>
      <div className="flex items-center space-x-4 ml-auto">
        <div className="relative">
          <Bell size={20} className="text-gray-600 cursor-pointer" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">
            4
          </span>
        </div>
        <ShoppingCart size={20} className="text-gray-600 cursor-pointer" />
        <User size={20} className="text-gray-600 cursor-pointer" />
      </div>
    </header>;
};