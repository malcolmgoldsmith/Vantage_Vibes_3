import React, { useState, useEffect } from 'react';
import { Card } from '../UI/Card';
import { Send, CheckCircle, XCircle, Loader } from 'lucide-react';

export const GeminiTest: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => {
    // Load saved API key from localStorage
    return localStorage.getItem('gemini_api_key') || 'AIzaSyDc5lEtlO5pUxAdMiu_AWexa6EXAKEbcw0';
  });
  const [testMessage, setTestMessage] = useState('Hello, Gemini! Please introduce yourself.');
  const [thinkingLevel, setThinkingLevel] = useState<'low' | 'high'>('high');
  const [response, setResponse] = useState('');
  const [modelVersion, setModelVersion] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    setLoading(true);
    setStatus('idle');
    setResponse('');

    try {
      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: testMessage,
              },
            ],
          },
        ],
      };

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await res.json();

      if (res.ok && data.candidates && data.candidates[0]) {
        setResponse(data.candidates[0].content.parts[0].text);
        setModelVersion(data.modelVersion || 'gemini-3-pro-preview');
        setStatus('success');

        // Save API key to localStorage on successful test
        localStorage.setItem('gemini_api_key', apiKey);
        console.log('✅ API key saved to localStorage');
      } else {
        setResponse(data.error?.message || JSON.stringify(data, null, 2));
        setStatus('error');
      }
    } catch (error) {
      setResponse(error instanceof Error ? error.message : 'Failed to connect');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-medium">Gemini API Settings</h1>

      {/* Model Info Card */}
      <Card title="Model Information">
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Model</p>
              <p className="font-medium text-lg">Gemini 3 Pro Preview</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Model ID</p>
              <p className="font-mono text-sm">gemini-3-pro-preview</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">API Version</p>
              <p className="font-mono text-sm">v1beta</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Knowledge Cutoff</p>
              <p className="font-medium">January 2025</p>
            </div>
          </div>
          {modelVersion && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Last Response Model Version</p>
              <p className="font-mono text-sm text-green-600">{modelVersion}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Test Connection Card */}
      <Card title="Test Gemini Connection">
        <div className="p-6 space-y-6">
          {/* API Key Input */}
          <div>
            <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              id="apiKey"
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Enter your Gemini API key"
            />
            <p className="mt-2 text-sm text-gray-500">
              When the connection test succeeds, this API key will be saved and used for all Vantage Apps generation.
            </p>
          </div>

          {/* Test Message Input */}
          <div>
            <label htmlFor="testMessage" className="block text-sm font-medium text-gray-700 mb-2">
              Test Message
            </label>
            <textarea
              id="testMessage"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              placeholder="Enter a test message"
            />
          </div>

          {/* Thinking Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thinking Level (Not yet supported in v1beta)
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer opacity-50">
                <input
                  type="radio"
                  value="low"
                  checked={thinkingLevel === 'low'}
                  onChange={(e) => setThinkingLevel(e.target.value as 'low' | 'high')}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm">Low (Fast, lower latency)</span>
              </label>
              <label className="flex items-center cursor-pointer opacity-50">
                <input
                  type="radio"
                  value="high"
                  checked={thinkingLevel === 'high'}
                  onChange={(e) => setThinkingLevel(e.target.value as 'low' | 'high')}
                  className="mr-2"
                  disabled
                />
                <span className="text-sm">High (Deep reasoning, default)</span>
              </label>
            </div>
          </div>

          {/* Test Button */}
          <div className="flex justify-end">
            <button
              onClick={testConnection}
              disabled={loading || !apiKey || !testMessage}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Test Connection
                </>
              )}
            </button>
          </div>

          {/* Status Indicator */}
          {status !== 'idle' && (
            <div
              className={`flex items-start gap-3 p-4 rounded-lg ${
                status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
              ) : (
                <XCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              )}
              <div className="flex-1">
                <h4
                  className={`font-medium mb-1 ${
                    status === 'success' ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {status === 'success' ? 'Connection Successful' : 'Connection Failed'}
                </h4>
                <p
                  className={`text-sm ${
                    status === 'success' ? 'text-green-700' : 'text-red-700'
                  }`}
                >
                  {response}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
