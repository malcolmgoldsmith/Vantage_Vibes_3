import React from 'react';
import { Card } from '../UI/Card';
import { Sparkles, Trash2, RefreshCw } from 'lucide-react';

interface GeneratedApp {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  componentCode: string;
  createdAt: string;
  validationWarnings?: string[];
  testStatus?: 'untested' | 'testing' | 'passed' | 'failed' | 'healing';
  testErrors?: string[];
}

interface AppCardProps {
  app: GeneratedApp;
  onOpen: (app: GeneratedApp) => void;
  onDebug: (app: GeneratedApp) => void;
  onUpdate: (app: GeneratedApp) => void;
  onDelete: (appId: string, appName: string) => void;
}

/**
 * Memoized AppCard component to prevent unnecessary re-renders
 * Only re-renders when app data changes
 */
export const AppCard = React.memo<AppCardProps>(({ app, onOpen, onDebug, onUpdate, onDelete }) => {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
            {app.iconUrl ? (
              <img src={app.iconUrl} alt={app.name} className="w-full h-full object-cover" />
            ) : (
              <Sparkles size={24} className="text-blue-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-lg mb-1 truncate">{app.name}</h3>
            <p className="text-sm text-gray-500">
              Created {new Date(app.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {app.description}
        </p>

        {/* Test Status Badge */}
        {app.testStatus && (
          <div className="mb-3">
            {app.testStatus === 'untested' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-2">
                <p className="text-xs text-gray-600">
                  ⏳ Not yet tested
                </p>
              </div>
            )}
            {app.testStatus === 'testing' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <p className="text-xs text-blue-700">
                  🔄 Testing in background...
                </p>
              </div>
            )}
            {app.testStatus === 'healing' && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
                <p className="text-xs text-purple-700">
                  🔧 Self-healing...
                </p>
              </div>
            )}
            {app.testStatus === 'passed' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-xs text-green-700">
                  ✅ Tests passed
                </p>
              </div>
            )}
            {app.testStatus === 'failed' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <p className="text-xs text-red-700">
                  ❌ Tests failed
                </p>
                {app.testErrors && app.testErrors.length > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    {app.testErrors[0]}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {app.validationWarnings && app.validationWarnings.length > 0 && (
          <div className="mb-3 bg-yellow-50 border border-yellow-200 rounded-lg p-2">
            <p className="text-xs text-yellow-700">
              ⚠️ {app.validationWarnings.length} warning{app.validationWarnings.length > 1 ? 's' : ''}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={() => onOpen(app)}
            className="flex-1 text-blue-600 border border-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors text-sm"
          >
            Open
          </button>
          <button
            onClick={() => onUpdate(app)}
            className="text-green-600 border border-green-600 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors text-sm"
            title="Update app"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => onDebug(app)}
            className="text-gray-600 border border-gray-300 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            title="Debug app"
          >
            Debug
          </button>
          <button
            onClick={() => onDelete(app.id, app.name)}
            className="text-red-600 border border-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm"
            title="Delete app"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </Card>
  );
});

// Display name for React DevTools
AppCard.displayName = 'AppCard';
