import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: any;
}

interface DebugLogProps {
  logs: LogEntry[];
  onClear: () => void;
}

export const DebugLog: React.FC<DebugLogProps> = ({ logs, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-blue-600 bg-blue-50';
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      default:
        return 'ℹ';
    }
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Terminal size={16} />
          Debug Log ({logs.length})
          <ChevronUp size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-[600px] max-h-[500px] bg-gray-900 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white">
          <Terminal size={16} />
          <span className="font-semibold">Debug Console</span>
          <span className="text-xs text-gray-400">({logs.length} entries)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClear}
            className="text-gray-400 hover:text-white transition-colors text-xs"
          >
            Clear
          </button>
          <button
            onClick={() => setIsExpanded(false)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronDown size={16} />
          </button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            No logs yet. Start creating an app to see debug information.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
              className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-800 transition-colors ${
                selectedLog?.id === log.id ? 'bg-gray-800' : ''
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-gray-500 flex-shrink-0">
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span className={`flex-shrink-0 ${getLevelColor(log.level)}`}>
                  {getLevelIcon(log.level)}
                </span>
                <span className={`flex-1 ${getLevelColor(log.level).split(' ')[0]}`}>
                  {log.message}
                </span>
              </div>
              {selectedLog?.id === log.id && log.details && (
                <div className="mt-2 ml-6 p-2 bg-gray-950 rounded text-gray-300 overflow-x-auto">
                  <pre className="text-xs whitespace-pre-wrap break-words">
                    {typeof log.details === 'string'
                      ? log.details
                      : JSON.stringify(log.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

// Hook to manage debug logs
export const useDebugLog = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (
    level: LogEntry['level'],
    message: string,
    details?: any
  ) => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      level,
      message,
      details
    };
    setLogs((prev) => [...prev, entry]);

    // Also log to console
    const consoleMethod = level === 'error' ? 'error' : level === 'warning' ? 'warn' : 'log';
    console[consoleMethod](`[${level.toUpperCase()}]`, message, details || '');
  };

  const clearLogs = () => setLogs([]);

  return {
    logs,
    addLog,
    clearLogs,
    info: (msg: string, details?: any) => addLog('info', msg, details),
    success: (msg: string, details?: any) => addLog('success', msg, details),
    warning: (msg: string, details?: any) => addLog('warning', msg, details),
    error: (msg: string, details?: any) => addLog('error', msg, details),
  };
};
