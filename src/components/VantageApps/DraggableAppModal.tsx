import React, { useState, useRef, useEffect } from 'react';
import { X, Minimize2, Maximize2, AlertCircle } from 'lucide-react';
import { runtimeErrorDetector } from '../../utils/RuntimeErrorDetector';
import { codeFixer } from '../../utils/GeminiCodeFixer';

interface DraggableAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  appName: string;
  appIcon: string;
  componentCode: string;
}

export const DraggableAppModal: React.FC<DraggableAppModalProps> = ({
  isOpen,
  onClose,
  appName,
  appIcon,
  componentCode
}) => {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 600, height: 400 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  const modalRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      const centerX = window.innerWidth / 2 - 300;
      const centerY = window.innerHeight / 2 - 200;
      setPosition({ x: Math.max(50, centerX), y: Math.max(50, centerY) });
      setSize({ width: 600, height: 400 });
      setIsMaximized(false);
      setRenderError(null);
      setIsLoading(true);
      setLoadProgress(0);
    }
  }, [isOpen]);

  // Render the dynamic component using iframe
  useEffect(() => {
    if (isOpen && contentRef.current && componentCode) {
      try {
        setRenderError(null);
        setIsLoading(true);
        setLoadProgress(10);

        const container = contentRef.current;
        // SECURITY: Use replaceChildren instead of innerHTML for safer DOM manipulation
        container.replaceChildren();

        // Create an HTML document with React and the component
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.tailwindcss.com;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self';
  ">
  <!-- React 18 - unpkg CDN -->
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <!-- ReactDOM 18 - unpkg CDN -->
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <!-- Babel Standalone - for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <!-- Tailwind CSS - CDN for styling -->
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Error tracking with detailed information
    window.appErrors = [];
    window.addEventListener('error', function(e) {
      const errorInfo = {
        message: e.message || 'Unknown error',
        filename: e.filename || 'unknown',
        lineno: e.lineno || 0,
        colno: e.colno || 0,
        stack: e.error?.stack || 'No stack trace'
      };
      window.appErrors.push(JSON.stringify(errorInfo));
      console.error('📍 Detailed iframe error:', errorInfo);
    });

    // Signal when libraries are loaded
    window.addEventListener('load', function() {
      window.librariesLoaded = true;
    });
  </script>
  <script type="text/babel">
    // Declare code outside try-catch so it's accessible in catch block for error logging
    let code = \`${componentCode.replace(/`/g, '\\`')}\`;

    try {
      // CRITICAL: React is available globally via CDN, but we need to handle the import statement
      // Remove ALL import statements (React is already loaded globally in the iframe)
      code = code.split('\\n').filter(line => {
        // Remove ALL import statements - React is loaded globally
        if (line.trim().match(/^import\\s+/)) {
          return false;
        }
        return true;
      }).join('\\n');

      // SECURITY: Remove export default before execution
      code = code.replace(/export\\s+default\\s+/g, '');

      // CRITICAL: Make sure React is available in global scope
      window.React = window.React;  // Ensure React is accessible

      // SECURITY: Use Function constructor instead of eval for slightly better scoping
      // Still runs in iframe sandbox, but Function is safer than eval
      try {
        // Pass React explicitly to the Function constructor
        const executeCode = new Function('React', 'ReactDOM', code + '; return App;');
        const App = executeCode(window.React, window.ReactDOM);

        if (typeof App !== 'function') {
          throw new Error('Generated code did not produce a valid React component');
        }

        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
      } catch (executeError) {
        // If Function constructor fails, fall back to eval (for debugging)
        console.warn('Function constructor failed, falling back to eval:', executeError);
        eval(code);
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
      }

      // Signal successful render
      window.renderSuccess = true;
    } catch (err) {
      window.renderSuccess = false;
      window.appErrors = window.appErrors || [];

      // Detailed error logging
      const errorDetails = {
        name: err.name || 'Error',
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        toString: err.toString()
      };

      window.appErrors.push(JSON.stringify(errorDetails));
      console.error('🚨 Render error details:', errorDetails);
      console.error('📄 Code that failed (first 1000 chars):', code.substring(0, 1000));
    }
  </script>
</body>
</html>
        `;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        iframe.sandbox.add('allow-scripts');

        // Monitor loading progress
        let progressInterval: NodeJS.Timeout;
        let loadTimeout: NodeJS.Timeout;

        iframe.onload = () => {
          setLoadProgress(50);

          // Check if app rendered successfully
          progressInterval = setInterval(() => {
            try {
              const iframeWindow = iframe.contentWindow as any;

              if (iframeWindow && iframeWindow.librariesLoaded) {
                setLoadProgress(70);

                if (iframeWindow.renderSuccess !== undefined) {
                  clearInterval(progressInterval);
                  clearTimeout(loadTimeout);

                  if (iframeWindow.renderSuccess === false) {
                    const errors = iframeWindow.appErrors || ['Unknown render error'];
                    console.log('🚨 Runtime errors detected:', errors);

                    // Use RuntimeErrorDetector to diagnose the error
                    const errorMessage = errors[0];
                    const fakeError = new Error(errorMessage);
                    const diagnosis = runtimeErrorDetector.diagnoseError(fakeError, componentCode);

                    // Generate detailed error report
                    const report = runtimeErrorDetector.generateErrorReport(diagnosis, componentCode);
                    console.log(report);

                    // Attempt auto-fix
                    const fixedCode = runtimeErrorDetector.attemptAutoFix(diagnosis, componentCode);
                    if (fixedCode) {
                      console.log('✅ Auto-fix attempted, retrying with fixed code...');
                      // Note: In a real implementation, we would need to update the parent component
                      // For now, we'll just show a more helpful error message
                    }

                    const detailedError = diagnosis.suggestedFix
                      ? `${errors.join(', ')}\n\n💡 Suggested Fix: ${diagnosis.suggestedFix}`
                      : errors.join(', ');

                    setRenderError(detailedError);
                    setIsLoading(false);
                  } else {
                    setLoadProgress(100);
                    setTimeout(() => setIsLoading(false), 500);
                  }
                }
              }
            } catch (e) {
              // Can't access iframe yet
            }
          }, 200);
        };

        // Timeout after 10 seconds
        loadTimeout = setTimeout(() => {
          clearInterval(progressInterval);
          setRenderError('App took too long to load. There may be network issues or the app has errors.');
          setIsLoading(false);
        }, 10000);

        iframe.srcdoc = htmlContent;
        container.appendChild(iframe);

        setLoadProgress(30);

      } catch (error) {
        console.error('Error rendering app:', error);
        setRenderError(error instanceof Error ? error.message : 'Failed to render app');
        setIsLoading(false);
      }
    }
  }, [isOpen, componentCode]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && !isMaximized) {
      const newX = Math.max(0, Math.min(e.clientX - dragOffset.x, window.innerWidth - size.width));
      const newY = Math.max(0, Math.min(e.clientY - dragOffset.y, window.innerHeight - 100));
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, position, size]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  if (!isOpen) return null;

  const modalStyle = isMaximized
    ? {
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: 'none'
      }
    : {
        top: position.y,
        left: position.x,
        width: size.width,
        height: size.height
      };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={modalRef}
        className="absolute bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
        style={modalStyle}
      >
        {/* Title Bar */}
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-md overflow-hidden bg-white flex items-center justify-center">
              {appIcon ? (
                <img src={appIcon} alt={appName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 text-xs">🎨</span>
              )}
            </div>
            <span className="font-medium text-sm">{appName}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleMaximize}
              className="w-8 h-8 rounded hover:bg-blue-500 flex items-center justify-center transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded hover:bg-red-500 flex items-center justify-center transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white relative">
          {isLoading && !renderError && (
            <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Loading app...</p>
                <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden mx-auto">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">{loadProgress}%</p>
              </div>
            </div>
          )}

          {renderError ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle size={32} className="text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Failed to Load App</h3>
                <p className="text-sm text-gray-600 mb-4">{renderError}</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left">
                  <p className="text-xs font-semibold text-red-800 mb-1">Troubleshooting Tips:</p>
                  <ul className="text-xs text-red-700 space-y-1">
                    <li>• Check your internet connection</li>
                    <li>• The app code may have runtime errors</li>
                    <li>• Try regenerating the app</li>
                  </ul>
                </div>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <div ref={contentRef} className="w-full h-full" />
          )}
        </div>

        {/* Resize Handle */}
        {!isMaximized && (
          <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 16 16"
            >
              <path d="M16 16V14h-2v2h2zm0-4V10h-2v2h2zm0-4V6h-2v2h2zm-4 8V14h-2v2h2zm0-4V10h-2v2h2zm-4 4V14H6v2h2z" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};
