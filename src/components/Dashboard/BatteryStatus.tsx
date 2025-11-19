import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '../UI/Card';
import { CircularProgress } from '../UI/CircularProgress';
export const BatteryStatus: React.FC = () => {
  const batteryPercentage = 82;
  const isCharging = true;
  return <Card title="Battery" actionIcon={<MoreHorizontal size={20} />}>
      <div className="flex flex-col items-center justify-center py-6">
        <CircularProgress percentage={batteryPercentage} color="#0072CE" icon={<img src="/image.png" alt="Battery" className="w-10 h-10" />} />
        <div className="mt-4 text-sm text-gray-600">
          {isCharging ? 'Charging • ' : ''}
          {batteryPercentage}% charged
        </div>
      </div>
    </Card>;
};