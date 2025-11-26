import React, { ReactNode } from 'react';
interface CircularProgressProps {
  percentage: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
  icon?: ReactNode;
  expired?: boolean;
  showPercentageText?: boolean;
}
export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  color = '#0072CE',
  size = 160,
  strokeWidth = 10,
  icon,
  expired = false,
  showPercentageText = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - percentage / 100 * circumference;

  // Adaptive font size based on circle size
  const getFontSize = () => {
    if (size <= 40) return 'text-[8px]';
    if (size <= 60) return 'text-xs';
    if (size <= 100) return 'text-lg';
    return 'text-3xl';
  };

  return <div className="relative" style={{
    width: size,
    height: size
  }}>
      {/* Background circle */}
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke="#E5E7EB"
          fill="white"
        />
        {/* Progress circle */}
        {!expired && <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          stroke={color}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {icon && <div className={expired ? 'mb-3 scale-150' : 'mb-2'}>{icon}</div>}
        {!expired && showPercentageText ? (
          <div className={`${getFontSize()} font-bold text-gray-700`}>
            {percentage}%
          </div>
        ) : expired ? (
          <div className="text-gray-900 font-medium text-base">Expired</div>
        ) : null}
      </div>
    </div>;
};