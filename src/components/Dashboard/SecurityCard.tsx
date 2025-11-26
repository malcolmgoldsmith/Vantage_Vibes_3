import React from 'react';
import { Card } from '../UI/Card';
export const SecurityCard: React.FC = () => {
  return <Card>
      <div className="flex p-4">
        <div className="w-1/3">
          <img src="/identitya.png" alt="Security illustration" className="w-full h-auto" style={{
          maxWidth: '150px'
        }} />
        </div>
        <div className="w-2/3 pl-4">
          <h3 className="font-medium mb-2">Lenovo Identity Advisor</h3>
          <p className="text-sm text-gray-600 mb-4">
            Help protect your data, combat identity theft, and discover unknown
            threats with ease. Monitor your digital life with Lenovo Identity
            Advisor.
          </p>
          <div className="flex justify-end space-x-4 mt-4">
            <button className="text-blue-600 hover:underline text-sm">
              Learn more
            </button>
            <button className="text-blue-600 hover:underline text-sm">
              Try now
            </button>
          </div>
        </div>
      </div>
    </Card>;
};