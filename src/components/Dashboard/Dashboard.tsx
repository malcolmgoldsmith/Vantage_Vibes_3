import React from 'react';
import { DeviceInfo } from './DeviceInfo';
import { BatteryStatus } from './BatteryStatus';
import { WarrantyCard } from './WarrantyCard';
import { PerformanceCard } from './PerformanceCard';
import { SecurityCard } from './SecurityCard';
import { Download } from 'lucide-react';
export const Dashboard: React.FC = () => {
  return <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-medium">Home</h1>
        <button className="flex items-center bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
          <Download size={16} className="mr-2" />
          Check for updates
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <DeviceInfo />
        <BatteryStatus />
        <WarrantyCard />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PerformanceCard />
        <SecurityCard />
      </div>
    </div>;
};