import React, { useState } from 'react';
import { Code, X, Minimize2, Maximize2, Copy, Check } from 'lucide-react';

interface CodeViewerProps {
  code: string;
  title: string;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({ code, title, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
        >
          <Code size={16} />
          View Code
          <Maximize2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-[700px] h-[600px] bg-gray-900 rounded-lg shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-2 text-white">
          <Code size={18} />
          <span className="font-semibold">{title}</span>
          <span className="text-xs text-gray-400 ml-2">
            {code.length} chars
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
            title="Copy code"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
            title="Minimize"
          >
            <Minimize2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-red-400"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 overflow-auto p-4 bg-gray-950">
        <pre className="text-xs text-gray-300 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-700 bg-gray-900 text-xs text-gray-500 flex items-center justify-between">
        <span>Scroll to view full code</span>
        {copied && <span className="text-green-400">✓ Copied to clipboard</span>}
      </div>
    </div>
  );
};

// Hook to manage code viewer state
export const useCodeViewer = () => {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    code: string;
    title: string;
  }>({
    isOpen: false,
    code: '',
    title: ''
  });

  const showCode = (code: string, title: string) => {
    setViewerState({
      isOpen: true,
      code,
      title
    });
  };

  const closeViewer = () => {
    setViewerState(prev => ({ ...prev, isOpen: false }));
  };

  return {
    viewerState,
    showCode,
    closeViewer
  };
};
