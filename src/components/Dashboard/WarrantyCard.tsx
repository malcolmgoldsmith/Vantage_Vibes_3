import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Card } from '../UI/Card';
import { CircularProgress } from '../UI/CircularProgress';
export const WarrantyCard: React.FC = () => {
  const warrantyExpired = true;
  return <Card title="Warranty" actionIcon={<MoreHorizontal size={20} />}>
      <div className="flex flex-col items-center justify-center py-4">
        <CircularProgress percentage={0} color="#D32F2F" icon={<img src="/redx.png" alt="Warranty Expired" className="w-6 h-6" />} expired={warrantyExpired} />
        <div className="mt-4 text-sm text-gray-600 flex items-center">
          Expired •{' '}
          <span className="text-blue-600 ml-1 cursor-pointer hover:underline">
            Upgrade now
          </span>
        </div>
      </div>
    </Card>;
};