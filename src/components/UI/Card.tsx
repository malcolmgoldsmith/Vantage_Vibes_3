import React, { ReactNode } from 'react';
interface CardProps {
  children: ReactNode;
  title?: string;
  actionIcon?: ReactNode;
}
export const Card: React.FC<CardProps> = ({
  children,
  title,
  actionIcon
}) => {
  return <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {title && <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
          <h3 className="font-medium text-base">{title}</h3>
          {actionIcon && <button className="text-gray-400 hover:text-gray-600">
              {actionIcon}
            </button>}
        </div>}
      <div>{children}</div>
    </div>;
};