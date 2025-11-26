export interface RuntimeTestResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  executionTime: number;
  hasVisibleContent: boolean;
}

export class RuntimeTester {
  /**
   * Test a React component by actually rendering it in a hidden iframe
   * This catches runtime errors that static analysis can't find
   */
  static async testComponent(componentCode: string, timeout: number = 5000): Promise<RuntimeTestResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const warnings: string[] = [];
    let hasVisibleContent = false;

    return new Promise((resolve) => {
      try {
        // Create a hidden iframe for testing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.left = '-9999px';
        iframe.style.width = '800px';
        iframe.style.height = '600px';
        iframe.style.visibility = 'hidden';
        iframe.sandbox.add('allow-scripts');

        // Create test HTML
        const testHTML = `
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
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Capture console errors
    window.testErrors = [];
    window.testWarnings = [];

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = function(...args) {
      window.testErrors.push(args.join(' '));
      originalError.apply(console, args);
    };

    console.warn = function(...args) {
      window.testWarnings.push(args.join(' '));
      originalWarn.apply(console, args);
    };

    // Signal when React is ready
    window.reactReady = false;
    if (typeof React !== 'undefined' && typeof ReactDOM !== 'undefined' && typeof Babel !== 'undefined') {
      window.reactReady = true;
    }
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

      // CRITICAL FIX: Remove 'export default' statement - it causes syntax error in browser eval()
      // The component function will be available as 'App' in global scope without export
      code = code.replace(/export\\s+default\\s+/g, '');

      // CRITICAL: Add React to global scope for the Function constructor
      // This ensures React.useState, React.useEffect, etc. work
      window.React = window.React;  // Make sure React is available

      // SECURITY: Use Function constructor instead of eval for slightly better scoping
      // Still runs in iframe sandbox, but Function is safer than eval
      // Note: This is still not 100% secure, but better than direct eval()
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
      setTimeout(() => {
        window.renderComplete = true;
        window.hasContent = document.getElementById('root').children.length > 0;
      }, 100);
    } catch (err) {
      // Detailed error logging
      const errorDetails = {
        name: err.name || 'Error',
        message: err.message || 'Unknown error',
        stack: err.stack || 'No stack trace',
        toString: err.toString()
      };

      window.testErrors.push(JSON.stringify(errorDetails));
      console.error('🚨 Render error details:', errorDetails);
      console.error('📄 Code that failed (first 1000 chars):', code.substring(0, 1000));
      window.renderComplete = false;
    }
  </script>
</body>
</html>
        `;

        // Timeout handler
        const timeoutId = setTimeout(() => {
          cleanup();
          errors.push('Component test timed out - may have infinite loop or async issues');
          resolve({
            success: false,
            errors,
            warnings,
            executionTime: Date.now() - startTime,
            hasVisibleContent: false
          });
        }, timeout);

        // Cleanup function
        const cleanup = () => {
          clearTimeout(timeoutId);
          if (iframe.parentNode) {
            document.body.removeChild(iframe);
          }
        };

        // Check test results periodically
        const checkInterval = setInterval(() => {
          try {
            const iframeWindow = iframe.contentWindow as any;

            if (!iframeWindow) {
              return;
            }

            // Check if React libraries loaded
            if (!iframeWindow.reactReady) {
              // Still loading external dependencies
              return;
            }

            // Check if render is complete
            if (iframeWindow.renderComplete !== undefined) {
              clearInterval(checkInterval);

              // Collect errors and warnings
              if (iframeWindow.testErrors && iframeWindow.testErrors.length > 0) {
                errors.push(...iframeWindow.testErrors);
              }

              if (iframeWindow.testWarnings && iframeWindow.testWarnings.length > 0) {
                warnings.push(...iframeWindow.testWarnings);
              }

              // Check if component rendered content
              hasVisibleContent = iframeWindow.hasContent === true;

              if (!hasVisibleContent) {
                warnings.push('Component rendered but produced no visible content');
              }

              cleanup();

              resolve({
                success: errors.length === 0 && iframeWindow.renderComplete === true,
                errors,
                warnings,
                executionTime: Date.now() - startTime,
                hasVisibleContent
              });
            }
          } catch (error) {
            // Can't access iframe yet, keep waiting
          }
        }, 100);

        // Load the iframe
        iframe.srcdoc = testHTML;
        document.body.appendChild(iframe);

      } catch (error) {
        errors.push(`Runtime test setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        resolve({
          success: false,
          errors,
          warnings,
          executionTime: Date.now() - startTime,
          hasVisibleContent: false
        });
      }
    });
  }

  /**
   * Quick syntax check using Babel transformation
   */
  static async checkBabelTransform(componentCode: string): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.sandbox.add('allow-scripts');

        const testHTML = `
<!DOCTYPE html>
<html>
<head>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <script>
    try {
      const code = ${JSON.stringify(componentCode)};
      const result = Babel.transform(code, { presets: ['react'] });
      window.transformSuccess = true;
    } catch (error) {
      window.transformError = error.message;
      window.transformSuccess = false;
    }
  </script>
</body>
</html>
        `;

        setTimeout(() => {
          try {
            const iframeWindow = iframe.contentWindow as any;
            if (iframeWindow && iframeWindow.transformSuccess !== undefined) {
              const success = iframeWindow.transformSuccess;
              const error = iframeWindow.transformError;

              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }

              resolve({ success, error });
            } else {
              if (iframe.parentNode) {
                document.body.removeChild(iframe);
              }
              resolve({ success: false, error: 'Transform check timed out' });
            }
          } catch (e) {
            if (iframe.parentNode) {
              document.body.removeChild(iframe);
            }
            resolve({ success: false, error: 'Could not access transform result' });
          }
        }, 2000);

        iframe.srcdoc = testHTML;
        document.body.appendChild(iframe);

      } catch (error) {
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    });
  }
}
