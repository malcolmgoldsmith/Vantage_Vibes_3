import React, { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const HelloWorld: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeMode, setIsCodeMode] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getApiKey = (): string => {
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey) return userKey;

    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;

    throw new Error('Gemini API key not configured');
  };

  const sendMessage = async (codePrompt?: string) => {
    const messageContent = codePrompt || input.trim();
    if (!messageContent || isLoading) return;

    const promptText = isCodeMode
      ? `Generate a complete, self-contained HTML page with inline CSS and JavaScript for: ${messageContent}

Requirements:
- Return ONLY the complete HTML code, starting with <!DOCTYPE html>
- Include all CSS in a <style> tag in the <head>
- Include all JavaScript in a <script> tag before closing </body>
- Make it interactive and visually appealing
- Use modern, clean design
- No external dependencies or imports
- The code should run immediately when loaded

Return only the HTML code, no explanations or markdown.`
      : messageContent;

    const userMessage: Message = {
      role: 'user',
      content: messageContent,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!codePrompt) setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const apiKey = getApiKey();

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: promptText
              }]
            }]
          })
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const responseText = data.candidates[0].content.parts[0].text;
        const assistantMessage: Message = {
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);

        // If in code mode, extract and set the generated code
        if (isCodeMode) {
          const extractedCode = extractCode(responseText);
          setGeneratedCode(extractedCode);

          // Auto-run the code after generation
          setTimeout(() => {
            if (iframeRef.current && extractedCode) {
              const wrappedCode = extractedCode.replace(
                '</body>',
                `
                <script>
                  // Capture console output
                  const originalLog = console.log;
                  const originalError = console.error;
                  const originalWarn = console.warn;

                  console.log = function(...args) {
                    window.parent.postMessage({ type: 'console', level: 'log', message: args.join(' ') }, '*');
                    originalLog.apply(console, args);
                  };

                  console.error = function(...args) {
                    window.parent.postMessage({ type: 'console', level: 'error', message: args.join(' ') }, '*');
                    originalError.apply(console, args);
                  };

                  console.warn = function(...args) {
                    window.parent.postMessage({ type: 'console', level: 'warn', message: args.join(' ') }, '*');
                    originalWarn.apply(console, args);
                  };

                  // Capture runtime errors
                  window.onerror = function(msg, url, line, col, error) {
                    window.parent.postMessage({ type: 'console', level: 'error', message: \`Error: \${msg}\` }, '*');
                    return false;
                  };
                </script>
                </body>`
              );

              const blob = new Blob([wrappedCode], { type: 'text/html' });
              const url = URL.createObjectURL(blob);
              iframeRef.current.src = url;
            }
          }, 100);
        }
      } else {
        throw new Error('No response from API');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCode = (text: string): string => {
    // Try to extract code from markdown code blocks
    const codeBlockMatch = text.match(/```html\n([\s\S]*?)\n```/);
    if (codeBlockMatch) {
      return codeBlockMatch[1];
    }

    // Try without language specifier
    const genericBlockMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (genericBlockMatch) {
      return genericBlockMatch[1];
    }

    // If it starts with <!DOCTYPE or <html, assume it's raw HTML
    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return text.trim();
    }

    // Otherwise return as-is
    return text;
  };

  const runCode = () => {
    if (!generatedCode || !iframeRef.current) return;

    setConsoleOutput([]);

    // Create a modified HTML that captures console output
    const wrappedCode = generatedCode.replace(
      '</body>',
      `
      <script>
        // Capture console output
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        console.log = function(...args) {
          window.parent.postMessage({ type: 'console', level: 'log', message: args.join(' ') }, '*');
          originalLog.apply(console, args);
        };

        console.error = function(...args) {
          window.parent.postMessage({ type: 'console', level: 'error', message: args.join(' ') }, '*');
          originalError.apply(console, args);
        };

        console.warn = function(...args) {
          window.parent.postMessage({ type: 'console', level: 'warn', message: args.join(' ') }, '*');
          originalWarn.apply(console, args);
        };

        // Capture runtime errors
        window.onerror = function(msg, url, line, col, error) {
          window.parent.postMessage({ type: 'console', level: 'error', message: \`Error: \${msg}\` }, '*');
          return false;
        };
      </script>
      </body>`
    );

    const blob = new Blob([wrappedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    iframeRef.current.src = url;
  };

  const clearCode = () => {
    setGeneratedCode('');
    setConsoleOutput([]);
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
  };

  const generateHelloWorld = () => {
    setIsCodeMode(true);
    sendMessage('A simple interactive hello world with a button that changes colors and displays a greeting message');
  };

  // Listen for console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        setConsoleOutput(prev => [...prev, `[${event.data.level}] ${event.data.message}`]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-4 p-4">
      {/* Left Side - Chat Interface */}
      <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">
                Gemini Code Generator
              </h1>
              <p className="text-xs text-gray-600">
                Generate and run code in real-time
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsCodeMode(!isCodeMode)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  isCodeMode
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {isCodeMode ? 'Code Mode' : 'Chat Mode'}
              </button>
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-3">{isCodeMode ? '💻' : '💬'}</div>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {isCodeMode ? 'Generate Code' : 'Start a conversation'}
              </h2>
              <p className="text-sm text-gray-500 mb-4">
                {isCodeMode
                  ? 'Describe what you want to build and Gemini will generate the code'
                  : 'Type a message below to chat with Gemini'}
              </p>
              {isCodeMode && (
                <button
                  onClick={generateHelloWorld}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                >
                  Try: Generate Hello World
                </button>
              )}
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      <div className="text-xs font-semibold mb-1">
                        {message.role === 'user' ? 'You' : 'Gemini'}
                      </div>
                      <div className="text-xs whitespace-pre-wrap break-words">
                        {message.content.length > 500 && isCodeMode
                          ? message.content.substring(0, 500) + '... [code truncated]'
                          : message.content}
                      </div>
                    </div>
                  </div>
                  <div className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-blue-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-pulse text-gray-600 text-xs">
                    {isCodeMode ? 'Generating code...' : 'Gemini is typing...'}
                  </div>
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span className="text-red-600 text-sm">⚠️</span>
                <div className="flex-1">
                  <div className="font-semibold text-red-900 text-xs mb-1">Error</div>
                  <div className="text-xs text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-3 flex-shrink-0">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                isCodeMode
                  ? 'Describe what you want to build...'
                  : 'Type your message... (Press Enter to send, Shift+Enter for new line)'
              }
              className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? 'Generating...' : isCodeMode ? 'Generate' : 'Send'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Code Preview & Execution */}
      {isCodeMode && (
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm border border-gray-200 min-h-0">
          {/* Code Preview Header */}
          <div className="border-b border-gray-200 p-4 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Code Preview</h2>
              <div className="flex gap-2">
                {generatedCode && (
                  <>
                    <button
                      onClick={copyCode}
                      className="px-3 py-1.5 text-xs bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      Copy Code
                    </button>
                    <button
                      onClick={runCode}
                      className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Run Code
                    </button>
                    <button
                      onClick={clearCode}
                      className="px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Code Display */}
          <div className="flex-1 flex flex-col min-h-0">
            {!generatedCode ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No code generated yet
                  </h3>
                  <p className="text-sm text-gray-500">
                    Ask Gemini to generate code and it will appear here
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Code Editor View */}
                <div className="flex-1 overflow-auto p-4 bg-gray-50 border-b border-gray-200 min-h-0">
                  <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-words">
                    {generatedCode}
                  </pre>
                </div>

                {/* Live Preview Iframe */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Live Preview</h3>
                  </div>
                  <div className="flex-1 relative min-h-0">
                    <iframe
                      ref={iframeRef}
                      className="absolute inset-0 w-full h-full border-0 bg-white"
                      sandbox="allow-scripts"
                      title="Code Preview"
                    />
                  </div>
                </div>

                {/* Console Output */}
                {consoleOutput.length > 0 && (
                  <div className="border-t border-gray-200 bg-gray-900 text-gray-100 p-3 max-h-32 overflow-y-auto flex-shrink-0">
                    <div className="text-xs font-mono space-y-1">
                      {consoleOutput.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap break-words">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
