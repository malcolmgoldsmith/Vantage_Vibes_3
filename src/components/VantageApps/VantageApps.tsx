import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ExternalLink, X, Sparkles, Edit, Maximize2, Minimize2 } from 'lucide-react';

interface SavedApp {
  id: string;
  name: string;
  description: string;
  htmlCode: string;
  iconUrl: string;
  createdAt: string;
}

interface AppIdea {
  name: string;
  description: string;
}

const STORAGE_KEY = 'vantage_apps';

const ALL_APP_IDEAS: AppIdea[] = [
  { name: "Polaroid Photo Booth", description: "Interactive photo booth that transforms uploaded images into retro Polaroid-style strips with vintage filters, customizable poses, and nostalgic white frames. Includes download and share features." },
  { name: "AI Mood Ring", description: "Animated mood ring that changes colors based on time of day, mouse movement, or user input. Features gradient animations, particle effects, and personalized mood insights with beautiful visual feedback." },
  { name: "Neon Sign Creator", description: "Design custom neon signs with glowing text effects, buzzing animations, color pickers, and realistic neon tube styling. Preview different fonts and download as images." },
  { name: "Aesthetic Collage Maker", description: "Create stunning visual collages with drag-and-drop images, filters, stickers, text overlays, and grid layouts. Export high-res collages perfect for social media." },
  { name: "Virtual Pet Garden", description: "Nurture animated pixel-art plants that grow in real-time. Water them, give them sunlight, and watch them bloom with satisfying particle effects and peaceful ambient sounds." },
  { name: "Lofi Music Visualizer", description: "Mesmerizing audio visualizer with waveforms, particles, and color-reactive animations. Features preset patterns and customizable visual effects that dance to your music." },
  { name: "Cosmic Fortune Teller", description: "Interactive mystical fortune teller with animated tarot cards, crystal ball effects, zodiac readings, and cosmic particle backgrounds. Reveals personalized fortunes with smooth reveal animations." },
  { name: "Retro Terminal Hacker", description: "Authentic 80s-style terminal simulator with green phosphor glow, typing effects, fake hacking sequences, Matrix-style rain, and customizable commands for a cyberpunk aesthetic." },
  { name: "Dream Journal Canvas", description: "Artistic dream journal with sketching tools, voice-to-text dream capture, mood tracking, and beautiful watercolor-style backgrounds. Tag dreams and discover patterns over time." },
  { name: "Synthwave Timer", description: "Stunning pomodoro timer with animated synthwave aesthetics, neon grid backgrounds, sunset gradients, and satisfying completion effects. Track productivity with retro-futuristic style." },
  { name: "Pixel Art Studio", description: "Complete pixel art editor with color palettes, animation frames, onion skinning, and sprite sheet export. Features undo/redo, zoom, and satisfying pixel placement sounds." },
  { name: "Starfield Screensaver", description: "Hypnotic 3D starfield with customizable speed, colors, and particle density. Stars zoom past with motion blur, creating a mesmerizing space travel effect. Interactive mouse control." },
  { name: "Vaporwave Playlist", description: "Aesthetic music player with animated Greek statues, palm trees, pink-purple gradients, and geometric shapes. Features track visualization, shuffle, and nostalgic 90s UI elements." },
  { name: "Breathing Exercise", description: "Calming breathing guide with expanding circle animations, ambient nature sounds, and customizable inhale/exhale timings. Gentle color transitions and particle effects for relaxation." },
  { name: "Emoji Rain", description: "Playful screen with falling emojis that respond to clicks, creating satisfying splashes and sounds. Customize emoji types, speed, and background. Includes catch-the-emoji mini-game." },
  { name: "Gradient Generator", description: "Beautiful gradient creator with live preview, color pickers, angle control, and CSS/image export. Features preset palettes, random generation, and smooth color transitions." },
  { name: "Typing Test Racer", description: "Speed typing game with neon car racing aesthetics. Your typing speed controls car movement. Real-time WPM tracking, leaderboards, and satisfying acceleration effects." },
  { name: "Magic 8 Ball", description: "Mystical decision maker with 3D ball physics, shake-to-ask interaction, glowing effects, and cosmic background. Smooth reveal animations and mysterious sound effects." },
  { name: "Sticky Note Wall", description: "Digital sticky notes with drag-to-arrange, color coding, and smooth animations. Features auto-save, categorization, and satisfying peel-off effects. Minimal aesthetic design." },
  { name: "Rain Window", description: "Cozy raindrop simulation on window glass with realistic physics, lightning flashes, ambient rain sounds, and blurred city background. Adjustable rain intensity and atmosphere." },
  { name: "Bookmark Organizer", description: "Sleek bookmark manager with drag-drop folders, tags, search, and beautiful card layouts. Features favicon display, quick access, and smooth category transitions." },
  { name: "Color Palette Extractor", description: "Upload images and extract beautiful color palettes with hex codes. Features drag-to-reorder colors, palette saving, and export options. Aesthetic swatch display." },
  { name: "Flip Card Memory Game", description: "Classic memory game with stunning card designs, smooth flip animations, particle effects on matches, and progressive difficulty. Features timer, moves counter, and celebration effects." },
  { name: "Ambient Sound Mixer", description: "Mix custom ambient soundscapes from rain, thunder, ocean waves, fireplace, and more. Visual waveforms, volume sliders, and preset combinations for focus or relaxation." },
  { name: "Binary Clock", description: "Futuristic binary time display with glowing LEDs, smooth transitions, and educational hover tooltips. Features customizable colors, 12/24 hour modes, and cyberpunk aesthetic." },
  { name: "Constellation Viewer", description: "Interactive night sky with clickable constellations, star names, mythology stories, and shooting star animations. Rotate view, zoom, and explore the cosmos with particle effects." },
  { name: "Habit Streak Tracker", description: "Motivational habit tracker with streak counters, satisfying check-off animations, progress charts, and encouraging messages. Features daily reminders and aesthetic progress visualization." },
  { name: "Quote Generator", description: "Inspiring quote display with beautiful typography, animated backgrounds, category filters, and share functionality. Features smooth quote transitions and aesthetic design patterns." },
  { name: "Doodle Board", description: "Simple drawing canvas with brush sizes, colors, eraser, and smooth stroke rendering. Features undo/redo, clear canvas, and download artwork. Minimal, satisfying interface." },
  { name: "Zen Garden", description: "Meditative sand garden with mouse-drag rake patterns, smooth particle trails, undo/redo, and calming sounds. Features preset patterns and satisfying sand displacement effects." },
  { name: "Name Generator", description: "Creative name generator for characters, businesses, or pets. Multiple categories, randomization, favorites list, and smooth reveal animations with copy-to-clipboard functionality." },
  { name: "Dice Roller", description: "3D dice rolling simulator with realistic physics, multiple dice types (D4-D20), smooth animations, and satisfying sounds. Features roll history and custom dice colors." },
  { name: "Flashcard Study", description: "Interactive flashcard system with flip animations, progress tracking, shuffle mode, and category organization. Features spaced repetition hints and satisfying swipe gestures." },
  { name: "Markdown Preview", description: "Live markdown editor with split-pane preview, syntax highlighting, export options, and smooth typing experience. Features dark mode and beautiful typography rendering." },
  { name: "Color Blindness Simulator", description: "Upload images and simulate different types of color blindness. Educational tool with before/after comparison, multiple vision types, and accessibility insights." },
  { name: "Pomodoro Cat Timer", description: "Cute pomodoro timer with animated cat that sleeps during breaks and works during sessions. Customizable work/break intervals with satisfying meow notifications." },
  { name: "Geometric Pattern Maker", description: "Create mesmerizing geometric patterns with symmetry tools, color schemes, and live preview. Features kaleidoscope effects, export options, and procedural generation." },
  { name: "Password Strength Checker", description: "Visual password analyzer with real-time strength meter, crack time estimate, and helpful suggestions. Features animated progress bars and security tips." },
  { name: "Lyrics Scroller", description: "Auto-scrolling lyrics display with adjustable speed, highlight current line, and beautiful typography. Features music-reactive animations and smooth scrolling effects." },
  { name: "BMI Calculator", description: "Health calculator with smooth sliders, instant results, visual chart, and helpful health tips. Features metric/imperial units and aesthetic progress visualization." },
  { name: "Coin Flip Decider", description: "Animated coin flip with realistic physics, heads/tails tracking, custom coin designs, and satisfying flip sound. Features flip history and streak counter." },
  { name: "Quick Poll Creator", description: "Simple poll maker with real-time voting, animated result bars, shareable links, and multiple choice options. Features smooth vote animations and result visualization." },
  { name: "Focus Mode Timer", description: "Minimalist focus timer with fullscreen mode, ambient background, gentle alerts, and session logging. Features customizable durations and calming color schemes." },
  { name: "ASCII Art Generator", description: "Convert text or images to ASCII art with adjustable detail levels, font options, and copy-to-clipboard. Features preview and multiple art styles." },
  { name: "Metronome", description: "Professional metronome with visual beat indicator, tempo slider, time signatures, and crisp click sounds. Features accent beats and smooth BPM adjustments." },
  { name: "QR Code Generator", description: "Create custom QR codes with logo embedding, color customization, and instant preview. Features download options and URL shortening integration." },
  { name: "Unit Converter Pro", description: "Comprehensive unit converter with length, weight, temperature, and more. Features smooth conversions, favorites, and beautiful category organization." },
  { name: "Word Counter", description: "Real-time text analysis with word count, character count, reading time, and keyword density. Features clean interface and instant statistics updates." },
  { name: "Color Contrast Checker", description: "WCAG accessibility checker with color pickers, contrast ratios, pass/fail indicators, and helpful suggestions. Features live preview and multiple standard levels." },
  { name: "Infinite Scroll Gallery", description: "Beautiful image gallery with lazy loading, smooth infinite scroll, lightbox view, and grid/masonry layouts. Features fade-in animations and responsive design." }
];

const getRandomIdeas = (count: number): AppIdea[] => {
  const shuffled = [...ALL_APP_IDEAS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const VantageApps: React.FC = () => {
  const [savedApps, setSavedApps] = useState<SavedApp[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState<SavedApp | null>(null);

  // Create/Edit flow state
  const [userPrompt, setUserPrompt] = useState('');
  const [selectedIdea, setSelectedIdea] = useState<AppIdea | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [editingApp, setEditingApp] = useState<SavedApp | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayedIdeas, setDisplayedIdeas] = useState<AppIdea[]>([]);

  const ideasScrollRef = useRef<HTMLDivElement>(null);

  // Load apps from localStorage and migrate old icon formats
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const apps = JSON.parse(stored);
        // Migrate apps with broken icons
        const migratedApps = apps.map((app: SavedApp) => {
          if (!app.iconUrl || !app.iconUrl.startsWith('data:image/svg+xml')) {
            return {
              ...app,
              iconUrl: generateEmojiIcon(app.description)
            };
          }
          return app;
        });
        setSavedApps(migratedApps);
      } catch (e) {
        console.error('Error loading apps:', e);
      }
    }
  }, []);

  // Save apps to localStorage
  useEffect(() => {
    if (savedApps.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedApps));
    }
  }, [savedApps]);

  const getApiKey = (): string => {
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey) return userKey;

    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;

    throw new Error('Gemini API key not configured');
  };

  const generateEmojiIcon = (description: string): string => {
    const colors = [
      '#dbeafe', '#fce7f3', '#e0e7ff', '#f3e8ff', '#fef3c7',
      '#d1fae5', '#fee2e2', '#ede9fe', '#fce7f3', '#ccfbf1'
    ];
    const icons = [
      '✨', '🎯', '📝', '🎨', '⚡', '🔥', '💡', '🚀', '🎪', '🌟',
      '📱', '🎵', '🎮', '📊', '🔔', '⏰', '📅', '🏃', '🍽️', '💪'
    ];
    const index = description.length % icons.length;
    const colorIndex = description.length % colors.length;

    const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="${colors[colorIndex]}" rx="16"/>
      <text x="50" y="70" font-size="48" text-anchor="middle" dominant-baseline="middle" font-family="system-ui, -apple-system, sans-serif">${icons[index]}</text>
    </svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  };

  const extractCode = (text: string): string => {
    const codeBlockMatch = text.match(/```html\n([\s\S]*?)\n```/);
    if (codeBlockMatch) return codeBlockMatch[1];

    const genericBlockMatch = text.match(/```\n([\s\S]*?)\n```/);
    if (genericBlockMatch) return genericBlockMatch[1];

    if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
      return text.trim();
    }

    return text;
  };

  const enhancePrompt = async () => {
    if (!userPrompt.trim() || isEnhancing) return;

    setIsEnhancing(true);
    try {
      const apiKey = getApiKey();

      const enhanceResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are a creative prompt enhancer for generating interactive web apps. Take this basic app idea and transform it into a vivid, detailed, creative prompt that will result in a stunning, interactive web application.

Original idea: "${userPrompt}"

Transform this into a bold, creative, detailed prompt that includes:
- Specific visual style (e.g., neon, retro, minimalist, aesthetic, cosmic, synthwave, vaporwave)
- Interactive elements and animations (particles, transitions, hover effects, smooth animations)
- Color schemes and visual effects (gradients, glows, shadows, filters)
- User interactions (drag-drop, click effects, keyboard controls, gestures)
- Unique features that make it memorable and fun
- Modern, trendy design elements

Examples of good enhancements:
- "timer" → "Stunning pomodoro timer with animated synthwave aesthetics, neon grid backgrounds, sunset gradients, and satisfying completion effects"
- "photo editor" → "Interactive photo booth that transforms images into retro Polaroid-style strips with vintage filters, customizable poses, and nostalgic white frames"
- "note app" → "Aesthetic note-taking app with gradient backgrounds, smooth card animations, drag-to-reorder, and beautiful typography with auto-save sparkle effects"

Be creative and bold! Think about what would make someone say "wow, this is cool!"

Return ONLY the enhanced prompt, no explanations or quotation marks.`
              }]
            }]
          })
        }
      );

      const enhanceData = await enhanceResponse.json();
      if (enhanceData.candidates && enhanceData.candidates[0]) {
        const enhancedText = enhanceData.candidates[0].content.parts[0].text.trim();
        setUserPrompt(enhancedText);
        setSelectedIdea(null);
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      alert('Failed to enhance prompt. Please try again.');
    } finally {
      setIsEnhancing(false);
    }
  };

  const startGeneration = async () => {
    const description = userPrompt || selectedIdea?.description || '';
    if (!description) return;

    setIsGenerating(true);
    setCurrentStep(1);
    setProgress(25);

    try {
      const apiKey = getApiKey();

      // Step 1: Generate app info (name + description)
      const infoResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Based on this app idea: "${description}", generate a creative app name and brief description. Return ONLY a JSON object with this exact format: {"name": "App Name", "description": "Brief description"}. No other text.`
              }]
            }]
          })
        }
      );

      const infoData = await infoResponse.json();
      if (infoData.candidates && infoData.candidates[0]) {
        const text = infoData.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const appInfo = JSON.parse(jsonMatch[0]);
          setAppName(appInfo.name);
          setAppDescription(appInfo.description);
        }
      }

      // Generate icon
      setIconUrl(generateEmojiIcon(description));

      // Step 2: Developing logic
      setCurrentStep(2);
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 3: Designing screens + Generate code
      setCurrentStep(3);
      setProgress(75);

      const codeResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate a complete, self-contained HTML page with inline CSS and JavaScript for: ${description}

VISUAL STYLE & DESIGN:
- Make it STUNNING and MODERN with bold design choices
- Use eye-catching color gradients, glows, shadows, and visual effects
- Add smooth, satisfying animations and transitions (fade, slide, scale, bounce, etc.)
- Include hover effects, active states, and micro-interactions
- Use modern CSS features: backdrop-filter, box-shadow, gradients, transforms
- Consider aesthetic styles: synthwave, vaporwave, glassmorphism, neumorphism, minimalist, retro, neon, cosmic, etc.

INTERACTIVITY:
- Make it highly interactive and responsive to user actions
- Add particle effects, visual feedback, and satisfying click/hover animations
- Include keyboard shortcuts where appropriate
- Smooth state transitions and loading animations
- Add sound effects or visual cues for important actions

TECHNICAL REQUIREMENTS:
- Return ONLY the complete HTML code, starting with <!DOCTYPE html>
- Include all CSS in a <style> tag in the <head>
- Include all JavaScript in a <script> tag before closing </body>
- No external dependencies or imports
- The code should run immediately when loaded
- Make it mobile-friendly and responsive

CRITICAL - NO BROWSER DEFAULTS:
- NEVER use alert(), confirm(), or prompt() functions
- Instead, create custom modal dialogs with HTML/CSS/JavaScript
- Custom modals should have:
  * Beautiful, modern styling with backdrop blur or dark overlay (use backdrop-filter: blur())
  * Smooth fade-in/fade-out animations with CSS transitions
  * Rounded corners, shadows, and polished design
  * Styled buttons that match the app's aesthetic
  * Perfect centering with flexbox
  * Close button with smooth hover effect
- Example modal structure: <div class="modal-overlay"><div class="modal-content">...</div></div>

INSPIRATION:
Think dribbble.com, behance.net level quality. Make something people would want to screenshot and share!

Return only the HTML code, no explanations or markdown.`
              }]
            }]
          })
        }
      );

      const codeData = await codeResponse.json();
      let generatedCode = '';

      if (codeData.candidates && codeData.candidates[0]) {
        const responseText = codeData.candidates[0].content.parts[0].text;
        generatedCode = extractCode(responseText);
      }

      // Step 4: Final touches
      setCurrentStep(4);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save the app
      const newApp: SavedApp = {
        id: Date.now().toString(),
        name: appName || description.substring(0, 50),
        description: appDescription || description,
        htmlCode: generatedCode,
        iconUrl: iconUrl,
        createdAt: new Date().toISOString(),
      };

      setSavedApps(prev => [newApp, ...prev]);

      // Reset and close
      setShowCreateModal(false);
      resetCreateFlow();

    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate app. Please try again.');
      setIsGenerating(false);
    }
  };

  const startEdit = async () => {
    if (!editingApp || !editPrompt.trim()) return;

    setIsGenerating(true);
    setCurrentStep(1);
    setProgress(25);

    try {
      const apiKey = getApiKey();

      setAppName(editingApp.name);
      setAppDescription(editingApp.description);
      setIconUrl(editingApp.iconUrl);

      // Step 2: Analyzing current code
      setCurrentStep(2);
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 3: Applying changes
      setCurrentStep(3);
      setProgress(75);

      const editResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `You are editing an existing HTML application. Here is the current code:

${editingApp.htmlCode}

User's edit request: ${editPrompt}

Generate the COMPLETE updated HTML code with the requested changes applied.

WHEN APPLYING CHANGES:
- Make improvements BOLD and VISUALLY STRIKING
- If adding features, make them aesthetic with smooth animations
- Enhance with gradients, glows, shadows, and modern effects
- Add satisfying micro-interactions and hover effects
- Keep the existing style consistent while making it even better
- Add particle effects or visual flourishes where appropriate

TECHNICAL REQUIREMENTS:
- Return ONLY the complete HTML code, starting with <!DOCTYPE html>
- Keep all CSS in a <style> tag in the <head>
- Keep all JavaScript in a <script> tag before closing </body>
- Maintain the app's existing functionality unless explicitly asked to change it
- Apply the user's requested changes with creative flair
- No external dependencies or imports

CRITICAL - NO BROWSER DEFAULTS:
- NEVER use alert(), confirm(), or prompt() functions
- Instead, create custom modal dialogs with beautiful styling, backdrop blur, smooth animations

Return only the HTML code, no explanations or markdown.`
              }]
            }]
          })
        }
      );

      const editData = await editResponse.json();
      let updatedCode = '';

      if (editData.candidates && editData.candidates[0]) {
        const responseText = editData.candidates[0].content.parts[0].text;
        updatedCode = extractCode(responseText);
      }

      // Step 4: Final touches
      setCurrentStep(4);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the app
      setSavedApps(prev =>
        prev.map(app =>
          app.id === editingApp.id
            ? { ...app, htmlCode: updatedCode }
            : app
        )
      );

      // Close edit mode and viewer
      setEditingApp(null);
      setEditPrompt('');
      setSelectedApp(null);
      setIsGenerating(false);

    } catch (error) {
      console.error('Edit error:', error);
      alert('Failed to edit app. Please try again.');
      setIsGenerating(false);
    }
  };

  const resetCreateFlow = () => {
    setUserPrompt('');
    setSelectedIdea(null);
    setIsGenerating(false);
    setCurrentStep(0);
    setProgress(0);
    setAppName('');
    setAppDescription('');
    setIconUrl('');
  };

  const openCreateModal = () => {
    resetCreateFlow();
    setDisplayedIdeas(getRandomIdeas(10));
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetCreateFlow();
  };

  const selectIdea = (idea: AppIdea) => {
    setSelectedIdea(idea);
    setUserPrompt(idea.description);
  };

  const deleteApp = (id: string) => {
    if (confirm('Are you sure you want to delete this app?')) {
      setSavedApps(prev => prev.filter(app => app.id !== id));
      if (selectedApp?.id === id) {
        setSelectedApp(null);
      }
    }
  };

  const openApp = (app: SavedApp) => {
    setSelectedApp(app);
  };

  const closeAppViewer = () => {
    setSelectedApp(null);
    setIsFullscreen(false);
  };

  const openEditMode = (app: SavedApp) => {
    setEditingApp(app);
    setEditPrompt('');
  };

  const cancelEdit = () => {
    setEditingApp(null);
    setEditPrompt('');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const STEP_LABELS = [
    '',
    'Creating plan',
    'Developing logic',
    'Designing screens',
    'Adding final touches'
  ];

  const EDIT_STEP_LABELS = [
    '',
    'Analyzing request',
    'Understanding current code',
    'Applying changes',
    'Finalizing updates'
  ];

  return (
    <>
      {/* Main App Grid */}
      <div className="h-full flex flex-col p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vantage Apps</h1>
            <p className="text-gray-600 mt-1">Create and manage your AI-generated apps</p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-xl">+</span>
            Create New App
          </button>
        </div>

        {savedApps.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">✨</div>
              <h2 className="text-2xl font-bold text-gray-700 mb-2">No apps yet</h2>
              <p className="text-gray-500 mb-6">Create your first app to get started</p>
              <button
                onClick={openCreateModal}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Your First App
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedApps.map(app => (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img
                    src={app.iconUrl}
                    alt={app.name}
                    className="w-12 h-12 rounded-lg flex-shrink-0"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = generateEmojiIcon(app.description);
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1 truncate">{app.name}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{app.description}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(app.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openApp(app)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open
                  </button>
                  <button
                    onClick={() => {
                      openApp(app);
                      setTimeout(() => openEditMode(app), 100);
                    }}
                    className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    title="Edit App"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => deleteApp(app.id)}
                    className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                    title="Delete App"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create App Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="border-b border-gray-200 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="text-blue-600" size={24} />
                <h2 className="text-2xl font-bold text-gray-900">Create New App</h2>
              </div>
              <button
                onClick={closeCreateModal}
                disabled={isGenerating}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {!isGenerating ? (
                <>
                  {/* App Ideas */}
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Try something like...</h3>
                    <div
                      ref={ideasScrollRef}
                      className="flex gap-3 overflow-x-auto pb-3 -mx-1 px-1"
                      style={{ scrollbarWidth: 'thin' }}
                    >
                      {displayedIdeas.map((idea, idx) => (
                        <button
                          key={idx}
                          onClick={() => selectIdea(idea)}
                          className={`flex-shrink-0 p-4 rounded-lg border-2 transition-all text-left ${
                            selectedIdea === idea
                              ? 'border-blue-600 bg-blue-50'
                              : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                          style={{ width: '220px' }}
                        >
                          <div className="font-semibold text-gray-900 text-sm mb-1">{idea.name}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Input */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Or describe your own app
                    </label>
                    <textarea
                      value={userPrompt}
                      onChange={(e) => {
                        setUserPrompt(e.target.value);
                        setSelectedIdea(null);
                      }}
                      placeholder="Describe what you want to build... (e.g., 'a timer', 'photo editor', 'music player')"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                    />
                    {userPrompt.trim() && (
                      <button
                        onClick={enhancePrompt}
                        disabled={isEnhancing}
                        className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isEnhancing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                            <span>Enhancing prompt...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} className="animate-pulse" />
                            <span>Make it more creative ✨</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={startGeneration}
                    disabled={!userPrompt.trim()}
                    className="w-full mt-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Generate App
                  </button>
                </>
              ) : (
                <>
                  {/* Generation Progress */}
                  <div className="text-center py-8">
                    {/* Icon with progress ring */}
                    <div className="relative inline-block mb-6">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl">
                        {iconUrl && <img src={iconUrl} alt="App icon" className="w-20 h-20 rounded-full" />}
                      </div>
                      {/* Progress Ring */}
                      <svg className="absolute inset-0 w-24 h-24 -rotate-90">
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="#e5e7eb"
                          strokeWidth="4"
                          fill="none"
                        />
                        <circle
                          cx="48"
                          cy="48"
                          r="44"
                          stroke="#3b82f6"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${2 * Math.PI * 44}`}
                          strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                          className="transition-all duration-500"
                        />
                      </svg>
                    </div>

                    {/* App Name */}
                    {appName && (
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{appName}</h3>
                    )}

                    {/* Current Step */}
                    <div className="mb-8">
                      <div className="text-lg font-semibold text-blue-600 mb-2">
                        {STEP_LABELS[currentStep]}
                      </div>
                      <div className="text-sm text-gray-500">{progress}% complete</div>
                    </div>

                    {/* Step Progress */}
                    <div className="space-y-3 max-w-xs mx-auto">
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                            currentStep > step
                              ? 'bg-green-500 text-white'
                              : currentStep === step
                              ? 'bg-blue-600 text-white animate-pulse'
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {currentStep > step ? '✓' : step}
                          </div>
                          <div className={`text-sm font-medium ${
                            currentStep >= step ? 'text-gray-900' : 'text-gray-400'
                          }`}>
                            {STEP_LABELS[step]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* App Viewer Modal */}
      {selectedApp && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-4'}`}>
          <div className={`bg-white flex flex-col ${isFullscreen ? 'w-full h-full' : 'rounded-lg w-full h-full max-w-6xl max-h-[90vh]'}`}>
            <div className="border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={selectedApp.iconUrl}
                  alt={selectedApp.name}
                  className="w-10 h-10 rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = generateEmojiIcon(selectedApp.description);
                  }}
                />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedApp.name}</h2>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editingApp && !isGenerating && (
                  <button
                    onClick={() => openEditMode(selectedApp)}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit App
                  </button>
                )}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
                <button
                  onClick={closeAppViewer}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Edit Panel */}
            {editingApp && editingApp.id === selectedApp.id && (
              <div className="border-b border-gray-200 p-4 bg-blue-50">
                {!isGenerating ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      What changes would you like to make?
                    </label>
                    <textarea
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="e.g., 'Add neon glow effects and particle animations' or 'Make it look more retro with a synthwave aesthetic' or 'Add a glassmorphism style with backdrop blur'"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
                      rows={3}
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={startEdit}
                        disabled={!editPrompt.trim()}
                        className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        Apply Changes
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="inline-flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-semibold text-gray-900">
                          {EDIT_STEP_LABELS[currentStep]}
                        </div>
                        <div className="text-xs text-gray-500">{progress}% complete</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex-1 relative">
              <iframe
                srcDoc={selectedApp.htmlCode}
                className="absolute inset-0 w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"
                title={selectedApp.name}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
