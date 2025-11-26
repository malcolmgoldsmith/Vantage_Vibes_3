import React, { useState, useEffect } from 'react';
import { X, Check, Loader } from 'lucide-react';
import { CircularProgress } from '../UI/CircularProgress';

interface AppGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  appPrompt: string;
  appName: string;
  appDescription: string;
  iconUrl: string;
  currentStep: number;
  progress: number;
  retryCount?: number;
}

const steps = [
  { id: 1, label: 'Creating plan', subtext: 'Analyzing requirements' },
  { id: 2, label: 'Developing logic', subtext: 'Building thought frameworks' },
  { id: 3, label: 'Designing screens', subtext: 'Crafting the UI' },
  { id: 4, label: 'Testing app', subtext: 'Validating functionality' }
];

export const AppGenerationModal: React.FC<AppGenerationModalProps> = ({
  isOpen,
  onClose,
  appPrompt,
  appName,
  appDescription,
  iconUrl,
  currentStep,
  progress,
  retryCount = 0
}) => {
  const [estimatedTime, setEstimatedTime] = useState('4min 49s');

  useEffect(() => {
    if (isOpen && progress > 0) {
      // Update estimated time based on progress
      const remainingPercentage = 100 - progress;
      const totalEstimatedSeconds = 289; // 4min 49s
      const remainingSeconds = Math.floor((remainingPercentage / 100) * totalEstimatedSeconds);
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      setEstimatedTime(`${minutes}min ${seconds}s`);
    }
  }, [progress, isOpen]);

  if (!isOpen) return null;

  const getStepStatus = (stepId: number) => {
    if (stepId < currentStep) return 'completed';
    if (stepId === currentStep) return 'in-progress';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Creating your app</h2>
            {retryCount > 0 && (
              <p className="text-sm text-orange-600 mt-1">
                Retrying... (Attempt {retryCount + 1})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={progress < 100}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Prompt Display */}
          <div className="mb-6 text-center">
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              {appPrompt}
            </h3>
            <p className="text-sm text-gray-600">
              Creating {appPrompt.toLowerCase()} to help you {appDescription.toLowerCase() || 'with your task'}
            </p>
          </div>

          {/* App Preview Card */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-xl shadow-md flex items-center justify-center overflow-hidden">
                  {iconUrl ? (
                    <img src={iconUrl} alt={appName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                </div>
                {/* Circular Progress Overlay */}
                <div className="absolute -bottom-2 -right-2 shadow-lg rounded-full">
                  <CircularProgress
                    percentage={progress}
                    color="#10B981"
                    size={40}
                    strokeWidth={4}
                    showPercentageText={true}
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1 truncate">
                  {appName || 'Your App'}
                </h4>
                <p className="text-xs text-gray-500 mb-2">
                  Estimated time {estimatedTime}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-3">
            {steps.map((step) => {
              const status = getStepStatus(step.id);

              return (
                <div
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all duration-300 ${
                    status === 'in-progress'
                      ? 'bg-blue-50 border border-blue-200'
                      : status === 'completed'
                      ? 'bg-green-50'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {status === 'completed' ? (
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : status === 'in-progress' ? (
                      <Loader size={20} className="text-blue-600 animate-spin" />
                    ) : (
                      <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        status === 'pending' ? 'text-gray-400' : 'text-gray-900'
                      }`}
                    >
                      {step.label}
                    </p>
                    {step.subtext && status === 'in-progress' && (
                      <p className="text-xs text-gray-600 mt-0.5">{step.subtext}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="mt-6">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-600 mt-2">{progress}% complete</p>
          </div>
        </div>
      </div>
    </div>
  );
};
