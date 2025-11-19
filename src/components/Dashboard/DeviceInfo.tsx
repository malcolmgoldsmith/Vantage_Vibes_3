import React from 'react';
import { MoreHorizontal, Copy } from 'lucide-react';
import { Card } from '../UI/Card';
export const DeviceInfo: React.FC = () => {
  const deviceInfo = {
    name: 'Yoga Slim 7 15ILL9',
    image: "/image.png",
    serialNumber: 'PF529KYW',
    productNumber: '83HM0001US',
    biosVersion: 'NYCN73WW'
  };
  return <Card title={deviceInfo.name} actionIcon={<MoreHorizontal size={20} />}>
      <div className="flex items-start p-4">
        <div className="w-1/3 flex items-center justify-center">
          <img src={deviceInfo.image} alt="Laptop" className="w-full h-auto object-contain" style={{
          maxWidth: '120px'
        }} />
        </div>
        <div className="flex-1 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Serial number</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">
                {deviceInfo.serialNumber}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Product number</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">
                {deviceInfo.productNumber}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Bios version</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">
                {deviceInfo.biosVersion}
              </span>
              <button className="text-gray-400 hover:text-gray-600">
                <Copy size={16} />
              </button>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button className="flex items-center text-blue-600 hover:text-blue-800">
              <span className="text-sm mr-1">Copy all</span>
              <Copy size={16} />
            </button>
          </div>
        </div>
      </div>
    </Card>;
};