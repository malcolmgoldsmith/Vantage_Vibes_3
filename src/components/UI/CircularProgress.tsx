import React, { ReactNode } from 'react';
interface CircularProgressProps {
  percentage: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  icon?: ReactNode;
  expired?: boolean;
}
export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color = '#0072CE',
  size = 160,
  strokeWidth = 10,
  icon,
  expired = false
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - percentage / 100 * circumference;
  return <div className="relative" style={{
    width: size,
    height: size
  }}>
      {/* Background circle */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke="#E5E7EB" fill="transparent" />
        {/* Progress circle */}
        {!expired && <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} stroke={color} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className={expired ? 'mb-3 scale-150' : 'mb-2'}>{icon}</div>}
        {!expired ? <div className="text-3xl font-semibold">{percentage}%</div> : <div className="text-gray-900 font-medium text-base">Expired</div>}
      </div>
    </div>;
};