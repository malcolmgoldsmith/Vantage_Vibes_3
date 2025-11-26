import React, { useState } from 'react';
import { X, RefreshCw } from 'lucide-react';

interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  componentCode: string;
  createdAt: string;
}

interface UpdateAppModalProps {
  isOpen: boolean;
  app: GeneratedApp | null;
  onClose: () => void;
  onSubmit: (app: GeneratedApp, updatePrompt: string) => void;
}

export const UpdateAppModal: React.FC<UpdateAppModalProps> = ({ isOpen, app, onClose, onSubmit }) => {
  const [updatePrompt, setUpdatePrompt] = useState('');

  if (!isOpen || !app) return null;

  const handleSubmit = () => {
    const trimmed = updatePrompt.trim();

    if (!trimmed) {
      alert('Please describe what you want to update');
      return;
    }

    if (trimmed.length < 3) {
      alert('Update description is too short. Please provide at least 3 characters.');
      return;
    }

    if (trimmed.length > 500) {
      alert('Update description is too long. Please keep it under 500 characters.');
      return;
    }

    onSubmit(app, trimmed);
    setUpdatePrompt('');
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <RefreshCw size={20} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Update App</h2>
              <p className="text-sm text-gray-500">{app.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Description:</h3>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
              {app.description}
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                What features or changes would you like to add?
              </label>
              <span className={`text-xs ${updatePrompt.length > 500 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {updatePrompt.length}/500
              </span>
            </div>
            <textarea
              value={updatePrompt}
              onChange={(e) => setUpdatePrompt(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="e.g., Add a dark mode toggle, include user authentication, make it mobile responsive..."
              maxLength={500}
              rows={4}
              className="w-full px-4 py-3 border border-green-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-800 placeholder-gray-400 resize-none"
            />
            {updatePrompt.length > 450 && updatePrompt.length <= 500 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Approaching character limit
              </p>
            )}
            {updatePrompt.length > 500 && (
              <p className="text-xs text-red-600 mt-2">
                ❌ Character limit exceeded
              </p>
            )}
          </div>

          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              💡 <strong>Tip:</strong> The AI will analyze your existing app and add the requested features while keeping the original functionality intact.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!updatePrompt.trim()}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Update App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
