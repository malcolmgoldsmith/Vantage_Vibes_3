import React, { useState } from 'react';

export const GeminiTest: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string>('');
  const [generatedImage, setGeneratedImage] = useState<string>('');

  const testGemini = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
      const result = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Say hello in one sentence.'
              }]
            }]
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(`API Error: ${result.status} - ${JSON.stringify(data)}`);
      }

      if (data.candidates && data.candidates[0]) {
        setResponse(data.candidates[0].content.parts[0].text);
      } else {
        setError('No response from API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const testImageGeneration = async () => {
    if (!apiKey.trim()) {
      setImageError('Please enter an API key');
      return;
    }

    setImageLoading(true);
    setImageError('');
    setGeneratedImage('');

    try {
      const result = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: 'Generate an image of a yellow banana wearing sunglasses'
              }]
            }],
            generationConfig: {
              responseModalities: ['image']
            }
          })
        }
      );

      const data = await result.json();

      if (!result.ok) {
        throw new Error(`API Error: ${result.status} - ${JSON.stringify(data)}`);
      }

      if (data.candidates && data.candidates[0] && data.candidates[0].content.parts[0]) {
        const imagePart = data.candidates[0].content.parts[0];

        // The image comes as inline_data with base64
        if (imagePart.inline_data) {
          const base64Image = imagePart.inline_data.data;
          const mimeType = imagePart.inline_data.mime_type || 'image/png';
          setGeneratedImage(`data:${mimeType};base64,${base64Image}`);
        } else {
          setImageError('No image data in response');
        }
      } else {
        setImageError('No response from API');
      }
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setImageLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold mb-6">Gemini API Test</h1>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>
        <input
          type="text"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your Gemini API key"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Text Generation Test */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Text Generation (Gemini 3 Pro)</h2>

        <button
          onClick={testGemini}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 mb-4 w-full"
        >
          {loading ? 'Testing...' : 'Test Text Generation'}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {response && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Response:</h3>
            <p className="text-green-700">{response}</p>
          </div>
        )}
      </div>

      {/* Image Generation Test */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Image Generation (Gemini 2.5 Flash)</h2>

        <button
          onClick={testImageGeneration}
          disabled={imageLoading}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 mb-4 w-full"
        >
          {imageLoading ? 'Generating...' : 'Test Image Generation (Banana with Sunglasses)'}
        </button>

        {imageError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-red-800 mb-2">Error:</h3>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{imageError}</pre>
          </div>
        )}

        {generatedImage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">Generated Image:</h3>
            <img
              src={generatedImage}
              alt="Generated banana with sunglasses"
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
      </div>
    </div>
  );
};
