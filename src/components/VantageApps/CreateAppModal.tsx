import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Mic } from 'lucide-react';
import { GeminiService, AppIdea, PRE_GENERATED_IDEAS } from '../../services/GeminiService';

interface CreateAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

export const CreateAppModal: React.FC<CreateAppModalProps> = ({ isOpen, onClose, onSubmit }) => {
  // Pre-load with pre-generated ideas for instant display
  const [ideas, setIdeas] = useState<AppIdea[]>(PRE_GENERATED_IDEAS);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasLoadedDynamicIdeas, setHasLoadedDynamicIdeas] = useState(false);

  // Mouse drag scrolling state
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    if (isOpen && !hasLoadedDynamicIdeas) {
      loadDynamicIdeas();
    }
  }, [isOpen, hasLoadedDynamicIdeas]);

  const loadDynamicIdeas = async () => {
    // Load dynamic ideas in the background to replace pre-generated ones
    try {
      const dynamicIdeas = await GeminiService.generateAppIdeas(10);
      setIdeas(dynamicIdeas);
      setHasLoadedDynamicIdeas(true);
    } catch (error) {
      // Keep pre-generated ideas if API fails
      console.error('Failed to load dynamic ideas, keeping pre-generated ones:', error);
    }
  };

  const loadMoreIdeas = async () => {
    if (isLoadingMore) return;

    setIsLoadingMore(true);
    const moreIdeas = await GeminiService.generateAppIdeas(5);
    setIdeas(prev => [...prev, ...moreIdeas]);
    setIsLoadingMore(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isNearEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 100;

    if (isNearEnd && !isLoadingMore) {
      loadMoreIdeas();
    }
  };

  const handleSubmit = () => {
    const trimmedValue = inputValue.trim();

    // Input validation
    if (!trimmedValue) {
      return; // Empty input
    }

    // Maximum length validation (500 characters)
    if (trimmedValue.length > 500) {
      alert('App description is too long. Please keep it under 500 characters.');
      return;
    }

    // Minimum length validation
    if (trimmedValue.length < 3) {
      alert('App description is too short. Please provide at least 3 characters.');
      return;
    }

    // Basic sanitization - remove potentially harmful characters
    const sanitized = trimmedValue
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, ''); // Remove inline event handlers

    // Rate limiting check (simple client-side check)
    const lastSubmitTime = localStorage.getItem('last_app_submit_time');
    const now = Date.now();
    if (lastSubmitTime) {
      const timeSinceLastSubmit = now - parseInt(lastSubmitTime);
      const minTimeBetweenSubmits = 10000; // 10 seconds minimum

      if (timeSinceLastSubmit < minTimeBetweenSubmits) {
        const remainingTime = Math.ceil((minTimeBetweenSubmits - timeSinceLastSubmit) / 1000);
        alert(`Please wait ${remainingTime} seconds before creating another app.`);
        return;
      }
    }

    // Update last submit time
    localStorage.setItem('last_app_submit_time', now.toString());

    onSubmit(sanitized);
    setInputValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Mouse drag scrolling handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2; // The multiplier controls scroll speed
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Create New App</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <h3 className="text-lg font-medium text-gray-700 mb-4">Try something like...</h3>

          {/* Scrollable Ideas */}
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            className="flex gap-4 overflow-x-auto pb-4 mb-8 hide-scrollbar"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              userSelect: 'none'
            }}
          >
            {loading ? (
              // Loading skeleton
              <>
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="min-w-[280px] h-[140px] bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </>
            ) : (
              <>
                {ideas.map((idea, index) => (
                  <button
                    key={`${idea.name}-${index}`}
                    onClick={() => setInputValue(idea.description)}
                    className="min-w-[280px] bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl p-5 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.02] border border-blue-100"
                  >
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {idea.name}
                    </h4>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {idea.description}
                    </p>
                    <div className="mt-3 flex items-center text-blue-600 text-sm font-medium">
                      <span>Try it</span>
                      <span className="ml-1">&rarr;</span>
                    </div>
                  </button>
                ))}
                {isLoadingMore && (
                  <div className="min-w-[280px] h-[140px] bg-gray-100 rounded-xl animate-pulse" />
                )}
              </>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-500 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Custom Input */}
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Describe your own app
              </label>
              <span className={`text-xs ${inputValue.length > 500 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {inputValue.length}/500
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Plus size={20} className="text-gray-600" />
              </button>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What should we make?"
                maxLength={500}
                className="flex-1 px-2 py-1 outline-none text-gray-800 placeholder-gray-400"
              />
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Mic size={20} className="text-gray-600" />
              </button>
            </div>
            {inputValue.length > 450 && inputValue.length <= 500 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ Approaching character limit
              </p>
            )}
            {inputValue.length > 500 && (
              <p className="text-xs text-red-600 mt-2">
                ❌ Character limit exceeded
              </p>
            )}
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
              disabled={!inputValue.trim()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create App
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};
