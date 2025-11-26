import React from 'react';
import { Card } from '../UI/Card';
export const PerformanceCard: React.FC = () => {
  return <Card>
      <div className="flex p-4">
        <div className="w-1/3">
          <img src="/smartp.png" alt="Performance illustration" className="w-full h-auto" style={{
          maxWidth: '150px'
        }} />
        </div>
        <div className="w-2/3 pl-4">
          <h3 className="font-medium mb-2">Lenovo Smart Performance</h3>
          <p className="text-sm text-gray-600 mb-4">
            Proactively find and fix any issues as they arise so that your PC
            always has top-notch performance.
          </p>
          <div className="flex justify-end space-x-4 mt-8">
            <button className="text-blue-600 hover:underline text-sm">
              Learn more
            </button>
            <button className="text-blue-600 hover:underline text-sm">
              Scan
            </button>
          </div>
        </div>
      </div>
    </Card>;
};