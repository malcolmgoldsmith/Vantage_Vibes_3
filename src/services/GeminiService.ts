import { codeFixer } from '../utils/GeminiCodeFixer';
import { logger } from '../utils/logger';

export interface AppIdea {
  name: string;
  description: string;
}

export interface GeneratedApp {
  name: string;
  description: string;
  iconUrl: string;
  componentCode: string;
}

// Pre-generated app ideas for instant loading
export const PRE_GENERATED_IDEAS: AppIdea[] = [
  { name: "Morning motivation quotes", description: "Get inspired with daily motivational quotes for a productive day ahead" },
  { name: "Meal prep suggestions", description: "Create personalized meal prep suggestions based on available ingredients" },
  { name: "Workout reminders", description: "Calendar-based workout reminders for an effective fitness routine" },
  { name: "Selfie to cartoon", description: "Image generator for turning selfies into cartoon avatars" },
  { name: "Focus timer", description: "Pomodoro-style timer to help you stay focused and productive" },
  { name: "Quick notes", description: "Simple note-taking app with automatic saving" },
  { name: "Habit tracker", description: "Track your daily habits and build better routines" },
  { name: "Color palette generator", description: "Generate beautiful color palettes for your projects" },
  { name: "Password generator", description: "Create strong, secure passwords with custom parameters" },
  { name: "Unit converter", description: "Convert between different units of measurement instantly" }
];

class GeminiServiceClass {
  private getApiKey(): string {
    // Check localStorage first (allows user override in Settings)
    const userKey = localStorage.getItem('gemini_api_key');
    if (userKey) return userKey;

    // Then check environment variable
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;

    // If neither exists, throw error
    throw new Error(
      'Gemini API key not configured. Please set VITE_GEMINI_API_KEY environment variable or configure in Settings.'
    );
  }

  async generateAppIdeas(count: number = 5): Promise<AppIdea[]> {
    const apiKey = this.getApiKey();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60 seconds

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Generate ${count} creative mini-app ideas suitable for a productivity dashboard. Each app should be simple and achievable with React components. Return ONLY a JSON array with this exact format: [{"name": "App Name", "description": "Brief description"}]. No other text or explanation.`
              }]
            }]
          })
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        // Extract JSON from markdown code blocks if present
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonText);
        }
      }

      // Fallback ideas if parsing fails
      return this.getFallbackIdeas(count);
    } catch (error) {
      logger.error('Error generating ideas', error);
      return this.getFallbackIdeas(count);
    }
  }

  private getFallbackIdeas(count: number): AppIdea[] {
    const ideas: AppIdea[] = [
      { name: "Morning motivation quotes", description: "Get inspired with daily motivational quotes for a productive day ahead" },
      { name: "Meal prep suggestions", description: "Create personalized meal prep suggestions based on available ingredients" },
      { name: "Workout reminders", description: "Calendar-based workout reminders for an effective fitness routine" },
      { name: "Selfie to cartoon", description: "Image generator for turning selfies into cartoon avatars" },
      { name: "Focus timer", description: "Pomodoro-style timer to help you stay focused and productive" },
      { name: "Quick notes", description: "Simple note-taking app with automatic saving" },
      { name: "Habit tracker", description: "Track your daily habits and build better routines" },
      { name: "Color palette generator", description: "Generate beautiful color palettes for your projects" },
      { name: "Password generator", description: "Create strong, secure passwords with custom parameters" },
      { name: "Unit converter", description: "Convert between different units of measurement instantly" }
    ];

    return ideas.slice(0, count);
  }

  async generateAppFromPrompt(prompt: string, onProgress?: (step: number, percentage: number) => void): Promise<GeneratedApp> {
    const apiKey = this.getApiKey();

    // Step 1: Generate app name and description (25%)
    onProgress?.(1, 25);
    const appInfo = await this.generateAppInfo(prompt, apiKey);

    // Step 2: Generate icon (50%)
    onProgress?.(2, 50);
    const iconUrl = await this.generateIcon(appInfo.description, apiKey);

    // Step 3: Generate component code (75%)
    onProgress?.(3, 75);
    const componentCode = await this.generateReactComponent(appInfo.description, apiKey);

    // Step 4: Final touches (100%)
    onProgress?.(4, 100);

    return {
      name: appInfo.name,
      description: appInfo.description,
      iconUrl,
      componentCode
    };
  }

  private async generateAppInfo(prompt: string, apiKey: string): Promise<{ name: string; description: string }> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // Increased to 60 seconds

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `Based on this app idea: "${prompt}", generate a catchy app name and brief description. Return ONLY a JSON object with this exact format: {"name": "App Name", "description": "Brief description"}. No other text.`
              }]
            }]
          })
        }
      );

      clearTimeout(timeoutId);
      const data = await response.json();

      if (data.candidates && data.candidates[0]) {
        const text = data.candidates[0].content.parts[0].text;
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonText = jsonMatch[1] || jsonMatch[0];
          return JSON.parse(jsonText);
        }
      }

      return { name: prompt, description: `A useful ${prompt} application` };
    } catch (error) {
      logger.error('Error generating app info', error);
      return { name: prompt, description: `A useful ${prompt} application` };
    }
  }

  async generateIcon(appDescription: string, apiKey: string): Promise<string> {
    // Imagen API has CORS issues when called from browser
    // Skip API call and use emoji fallback directly
    return this.generateEmojiIcon(appDescription);
  }

  private generateEmojiIcon(description: string): string {
    // Simple emoji-based fallback
    const emojis = ['✨', '🎯', '📝', '🎨', '⚡', '🔥', '💡', '🚀', '🎪', '🌟'];
    const index = description.length % emojis.length;

    // Create a simple SVG with emoji - use encodeURIComponent for Unicode support
    const svg = `<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#e0f2fe" rx="20"/><text x="50" y="65" font-size="50" text-anchor="middle">${emojis[index]}</text></svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
  }

  async generateReactComponent(description: string, apiKey: string): Promise<string> {
    const maxRetries = 3; // Increased from 2 to 3 for Phase 2

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      logger.info(`Generation attempt ${attempt + 1}/${maxRetries}`, { description: description.substring(0, 50) });
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 120 seconds (2 minutes) for code generation

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `═══════════════════════════════════════════════════════════
🚨 YOUR CODE IS BROKEN WITHOUT THIS FIRST LINE 🚨
═══════════════════════════════════════════════════════════

Line 1 MUST be: import React from 'react';
Line 2: blank line
Line 3: export default function App() {

WITHOUT THE IMPORT, CODE WILL CRASH: "React is not defined"

YOUR FIRST LINE OF OUTPUT:
import React from 'react';

═══════════════════════════════════════════════════════════

Now, create a complete, production-ready React component for: ${description}

START YOUR CODE WITH:
import React from 'react';

🚨 CRITICAL REQUIREMENTS - READ CAREFULLY:

📦 CODE COMPLETENESS:
1. FIRST LINE: import React from 'react';
2. SECOND LINE: blank line
3. THIRD LINE: export default function App() {
4. Do NOT write explanatory text before the import
5. Do NOT skip the React import - CODE WILL CRASH WITHOUT IT
6. Use React.useState, React.useEffect (with React prefix) for all hooks
7. Ensure NO undefined variables or missing dependencies
8. Follow React best practices and modern syntax
9. Write self-contained, production-ready code that runs without modifications

⚠️ VERIFY YOUR CODE STARTS WITH THIS EXACT SEQUENCE:
import React from 'react';

export default function App() {

IF YOUR CODE DOESN'T START WITH "import React from 'react';" IT IS BROKEN.
✓ All React hooks and methods have corresponding imports
✓ React is imported (required for JSX)
✓ No syntax errors or undefined references
✓ All variables are declared before use
✓ All functions are defined before being called
✓ No typos in variable or function names

🎯 OUTPUT FORMAT:
- MUST begin with: import React from 'react';
- Provide complete code file ready to copy and run
- Include all imports even if they will be removed during processing
- Use ONLY React.useState, React.useEffect syntax (with React prefix) - NEVER plain useState/useEffect
- After imports, start with EXACTLY "export default function App() {"
- Return ONLY valid JavaScript code, NO explanations or markdown

⚠️ MANDATORY JSX/React Syntax Rules - MEMORIZE THESE PATTERNS:

1. **style with percentages - backticks REQUIRED:**
   ✅ CORRECT: style={{ width: \`\${value}%\` }}
   ❌ WRONG: style={{ width: \${value}% }}

2. **className with dynamic values - backticks REQUIRED:**
   ✅ CORRECT: className={\`static-class \${dynamic} other-class\`}
   ❌ WRONG: className={static-class \${dynamic} other-class}

3. **Space between dynamic and static classes - REQUIRED:**
   ✅ CORRECT: className={\`\${condition ? 'class1' : 'class2'} static-class\`}
   ❌ WRONG: className={\`\${condition ? 'class1' : 'class2'}static-class\`}

4. **String interpolation - backticks REQUIRED:**
   ✅ CORRECT: {\`\${winner} WINS!\`}
   ❌ WRONG: \${winner} WINS!

🔧 THREE-LAYER VALIDATION PROTOCOL (Run on EVERY className/style attribute):

Layer 1: The Container
- Does prop start with className={ and end with }?
- ERROR: className="\${variable}" ❌ (Cannot interpolate in quotes)
- CORRECT: className={\`static \${variable}\`} ✅

Layer 2: The Template Literal
- Inside JSX braces, does string start AND end with backtick?
- ERROR: className={static \${variable}} ❌ (Missing backticks)
- CORRECT: className={\`static \${variable}\`} ✅

Layer 3: The Interpolation (CRITICAL)
- Every \${ MUST have matching } before next character
- ERROR: \${variable}\` ❌ (Merged closing brace with backtick)
- ERROR: \${variable}}\` ❌ (Extra brace)
- CORRECT: \`\${variable}\` ✅ (Clean: backtick, dollar, brace, content, brace, backtick)

WHITESPACE RULE:
- Space BEFORE \${} when injecting into class list
- ERROR: btn-primary\${dynamic} ❌
- CORRECT: btn-primary \${dynamic} ✅

VALIDATION CHECKLIST - Check EVERY instance:
□ Every className with \${} starts with backtick immediately after {
□ Every style percentage: \`\${value}%\` (% INSIDE backtick)
□ Space before every \${} when concatenating classes
□ Every \${ has matching } before closing backtick
□ No merged delimiters: \${var}\` or \${var}}\`

🎯 CRITICAL Requirements - THESE ARE MANDATORY:

✅ Component Structure:
- Must be a single React functional component named "App"
- MUST use "React.useState" and "React.useEffect" (with React prefix) for all hooks
- Include all necessary logic and UI - make it complete and self-contained
- Use Tailwind CSS classes for styling (no custom CSS)
- Make it interactive and fully functional

✅ Code Quality:
- Return ONLY valid JavaScript code, NO explanations or markdown
- Start with EXACTLY "export default function App() {"
- All brackets, parentheses, and braces MUST be properly balanced
- All strings must be properly quoted with correct backticks
- No syntax errors - the code must execute immediately without fixes
- NO undefined variables - declare everything before use
- NO missing functions - define all functions before calling them

✅ Mathematical Operators (CRITICAL):
    * Example: setInterval(() => setProgress(prev => Math.min(100, prev + 3)), 150)
    * This gives: 100 units ÷ 3 per tick = ~33 ticks × 150ms = ~5 seconds total
  - WRONG patterns that cause problems:
    * Fast interval + large random: setInterval(() => prev + Math.random() * 15, 100) ❌ (jumpy, reaches 75% then stalls)
    * Slow interval + tiny increment: setInterval(() => prev + 1, 1000) ❌ (takes 100 seconds!)
    * No Math.min cap: setProgress(prev => prev + 5) ❌ (exceeds 100%)
  - Progress MUST move evenly through ALL ranges: 0-25%, 25-50%, 50-75%, 75-100%
  - Always use Math.min(100, prev + increment) to cap at 100%
  - Always clear interval when reaching 100% or component unmounts

CRITICAL React/JSX RULES - MUST FOLLOW TO AVOID SYNTAX ERRORS:

1. **className attribute ALWAYS needs quotes or backticks:**
   - Static classes: className="static-classes"
   - Dynamic with \${}: className={\`dynamic \${condition ? 'class1' : 'class2'}\`}
   - WRONG: className={dynamic classes without quotes} ❌

2. **Template Literals - backticks are REQUIRED for string interpolation:**
   - CORRECT: \`Player \${name} wins!\` ✅
   - WRONG: Player \${name} wins! ❌ (missing backticks)

3. **Dynamic className - Use backticks with \${}:**
   - CORRECT: className={\`base-class \${isActive ? 'active' : ''}\`} ✅
   - WRONG: className={base-class \${isActive ? 'active' : ''}} ❌ (missing backticks)

4. **NEVER start template literal with \${:**
   - WRONG: className={\${condition ? 'class' : ''}} ❌ (starts with \${, invalid syntax)
   - CORRECT: className={condition ? 'class' : ''} ✅ (no \${}, no backticks needed)
   - CORRECT: className={\`static \${condition ? 'class' : ''}\`} ✅ (has static text, needs backticks)

5. **Units and symbols INSIDE the backticks:**
   - CORRECT: style={{ width: \`\${percentage}%\` }} ✅
   - WRONG: style={{ width: \`\${percentage}\`% }} ❌ (% outside backticks)

6. **NEVER nest backticks:**
   - CORRECT: className={\`text-lg \${isActive ? 'font-bold' : 'font-normal'}\`} ✅
   - WRONG: className={\`text-lg \`\${isActive ? 'font-bold' : 'font-normal'}\`\`} ❌ (nested backticks)

CRITICAL BACKTICK RULES - MOST COMMON ERRORS:
1. Units MUST be INSIDE the backticks with the variable
   - CORRECT: \`\${value}%\`
   - WRONG: \`\${value}\`%
   - CORRECT: \`\${x}px\`
   - WRONG: \`\${x}\`px
2. NEVER nest backticks - use ONE pair of backticks for the entire string
   - CORRECT: className={\`text-lg \${isActive ? 'font-bold' : 'font-normal'}\`}
   - WRONG: className={\`text-lg \`\${isActive ? 'font-bold' : 'font-normal'}\`\`}
   - CORRECT: \`Player \${name}\`
   - WRONG: Player\`\${name}\`
3. ALL arithmetic operations MUST have explicit operators
   - CORRECT: value * 2
   - WRONG: value  2
   - CORRECT: Math.random() * array.length
   - WRONG: Math.random()  array.length
   - CORRECT: energy + (1.5 * deltaTime)
   - WRONG: energy + (1.5  deltaTime)

🚫 FORBIDDEN (these will cause IMMEDIATE ERRORS):
- ❌ Do NOT skip the React import - MUST include: import React from 'react';
- ❌ Do NOT use other import statements besides React (import ... from ...) - they will be stripped automatically
- ❌ Do NOT use require() statements
- ❌ Do NOT use eval, innerHTML, dangerouslySetInnerHTML, or script tags
- ❌ Do NOT use <style> tags or dangerouslySetInnerHTML - use inline styles or Tailwind classes only
- ❌ Do NOT use plain useState/useEffect without React prefix - ALWAYS use React.useState
- ❌ Do NOT include markdown code blocks or backticks in your response
- ❌ Do NOT include any explanatory text before or after the code
- ❌ Do NOT use export statements other than "export default function App"
- ❌ Do NOT EVER write className={text \${variable}...} - this is a SYNTAX ERROR (missing backticks!)
- ❌ NEVER use \${} without wrapping the entire string in backticks
- ❌ NEVER use undefined variables - declare ALL variables with const/let before use
- ❌ NEVER call functions before defining them

✅ BEFORE RETURNING CODE - FINAL VERIFICATION CHECKLIST:
You MUST verify your code passes ALL these checks before returning it:

1. Template Literal Syntax:
   ✓ No nested backticks within template literals (use ONE pair of backticks for entire string)
   ✓ All \${} expressions are wrapped in backticks
   ✓ Percent signs and units (%, px, etc.) are INSIDE the template literal closing backtick
   ✓ className uses single template literal with \${} interpolation, not nested backticks

2. Mathematical Operators:
   ✓ All math operations have explicit operators (*, +, -, /)
   ✓ No spaces between numbers where operators should be

3. Variables and Functions:
   ✓ All variables declared with const/let before use
   ✓ All functions defined before being called
   ✓ No typos in variable or function names
   ✓ All React hooks use React.useState/React.useEffect syntax

4. Code Completeness:
   ✓ No syntax errors - code must execute immediately without fixes
   ✓ No undefined references
   ✓ All brackets properly balanced
   ✓ Component is complete and self-contained

Generate syntactically correct code that will run without errors.

📋 Example CORRECT format (COPY THIS STRUCTURE):

import React from 'react';

export default function App() {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Counter: {count}</h1>
      <button
        onClick={() => setCount(count + 1)}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Increment
      </button>
    </div>
  );
}

⚠️ CRITICAL: Your code MUST start with "import React from 'react';" followed by the component.

Now create the component for: ${description}`
                }]
              }]
            })
          }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
          let code = data.candidates[0].content.parts[0].text;

          logger.debug('Raw code from Gemini', { preview: code.substring(0, 500) });

          // PHASE 2: Validate raw response BEFORE cleanup
          const validationResult = this.validateGeminiResponse(code);

          if (!validationResult.isValid) {
            logger.error(`Gemini response validation failed (attempt ${attempt + 1}/${maxRetries})`, new Error(validationResult.reason));

            // If not the last attempt, retry
            if (attempt < maxRetries - 1) {
              logger.info('Retrying generation due to validation failure');
              continue; // Skip to next iteration
            } else {
              logger.error('All retry attempts exhausted due to validation failures');
              return this.getFallbackComponent(description);
            }
          }

          logger.debug('Raw response validation passed, proceeding to cleanup');

          // Clean up the code
          code = this.cleanupGeneratedCode(code);

          logger.debug('After cleanup', { preview: code.substring(0, 500), length: code.length });

          // Validate the cleaned code before returning (second-stage validation)
          logger.debug('Running post-cleanup validation');
          const isValid = this.validateGeneratedCode(code);
          logger.validation('Post-cleanup validation', isValid);

          if (isValid) {
            logger.success(`Code passed all validations on attempt ${attempt + 1}/${maxRetries}`);
            return code;
          } else if (attempt < maxRetries - 1) {
            logger.warn(`Post-cleanup validation failed on attempt ${attempt + 1}/${maxRetries}, retrying`);
            continue;
          } else {
            logger.error(`Code failed post-cleanup validation on final attempt ${maxRetries}/${maxRetries}`);
          }
        }

        if (attempt === maxRetries - 1) {
          return this.getFallbackComponent(description);
        }
      } catch (error) {
        // Check if it's an abort/timeout error
        const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));

        if (isTimeout) {
          logger.error(`Request timeout on attempt ${attempt + 1}/${maxRetries} - Gemini API took longer than 120 seconds`, error);
          logger.warn('Consider simplifying the app description or trying again later');
        } else {
          logger.error(`Error generating component (attempt ${attempt + 1})`, error);
        }

        if (attempt === maxRetries - 1) {
          if (isTimeout) {
            logger.error('All attempts timed out - returning fallback component');
          }
          return this.getFallbackComponent(description);
        }
      }
    }

    return this.getFallbackComponent(description);
  }

  private cleanupGeneratedCode(code: string): string {
    // Log the raw input for debugging
    logger.debug('Raw code received from Gemini', {
      length: code.length,
      startsWithImport: code.trimStart().startsWith('import React'),
      preview: code.substring(0, 150)
    });

    // Remove any leading/trailing whitespace
    code = code.trim();

    // CRITICAL FIX: Strip any explanatory text BEFORE the actual code
    // Gemini sometimes adds explanations like "Based on the requirements, I have designed..."
    // CRITICAL: Extract code from markdown code blocks FIRST
    // This must happen before stripping explanatory text, otherwise we might
    // strip the opening ``` marker and fail to extract the code
    const codeMatch = code.match(/```(?:jsx|javascript|tsx|typescript)?\s*\n([\s\S]*?)\n```/);
    if (codeMatch) {
      logger.debug('Extracted code from markdown code block');
      code = codeMatch[1].trim();
    }

    // We need to find where the actual code starts (either "import React" or "export default function")
    // This only runs if markdown extraction didn't happen
    // CRITICAL: Check if code already starts with valid code pattern - if so, don't strip anything
    const codeStartPatterns = [
      /^import\s+React\s+from\s+['"]react['"]/,  // Starts with React import
      /^export\s+default\s+function\s+App/,       // Starts with export default
      /^function\s+App\s*\(/                      // Starts with function App
    ];

    let foundAtStart = false;
    for (const pattern of codeStartPatterns) {
      if (pattern.test(code)) {
        foundAtStart = true;
        logger.debug('Code already starts with valid pattern - no stripping needed');
        break;
      }
    }

    // Only strip if code doesn't already start with valid pattern
    if (!foundAtStart) {
      const searchPatterns = [
        /import\s+React\s+from\s+['"]react['"]/,
        /export\s+default\s+function\s+App/,
        /function\s+App\s*\(/
      ];

      for (const pattern of searchPatterns) {
        const match = code.match(pattern);
        if (match && match.index !== undefined && match.index > 0) {
          // Found code start - extract everything from that point onward
          const beforeCode = code.substring(0, match.index);
          if (beforeCode.length > 10) { // Only log if significant text was removed
            logger.debug('Stripping explanatory text before code', { preview: beforeCode.substring(0, 100) });
          }
          code = code.substring(match.index);
          break;
        }
      }
    }

    // Remove any remaining markdown artifacts
    // NOTE: Do NOT remove backticks from code - they're needed for template literals
    // The markdown code block extraction above already handles ``` blocks
    // Removing backticks here can corrupt import statements and template literals

    // Remove markdown bold/italic
    code = code.replace(/\*\*([^*]+)\*\*/g, '$1');
    code = code.replace(/\*([^*]+)\*/g, '$1');

    // CRITICAL: Remove import statements EXCEPT React import (React is loaded globally in iframe)
    // Keep: import React from 'react';
    // Remove: all other imports
    const lines = code.split('\n');
    const filteredLines = lines.filter(line => {
      // Keep the React import - it's harmless since React is loaded globally
      if (line.trim().match(/^import\s+React\s+from\s+['"]react['"]/i)) {
        return true;
      }
      // Remove all other import statements
      if (line.trim().match(/^import\s+/)) {
        return false;
      }
      return true;
    });
    code = filteredLines.join('\n');

    // Remove require statements
    code = code.replace(/const\s+.*?=\s*require\(['"].*?['"]\)\s*;?/g, '');
    code = code.replace(/require\(['"].*?['"]\)/g, '');

    // CRITICAL: Ensure React import is always present at the beginning
    const hasReactImportAfterCleanup = /^import\s+React\s+from\s+['"]react['"]/m.test(code);
    if (!hasReactImportAfterCleanup) {
      console.error('🚨 GEMINI IGNORED INSTRUCTIONS - React import missing!');
      logger.error('React import missing from generated code - adding it automatically', {
        codePreview: code.substring(0, 200)
      });
      code = `import React from 'react';\n\n${code}`;
      logger.info('Added React import to beginning of code');
    } else {
      logger.debug('✅ React import found in generated code');
    }

    // Ensure function has proper export default
    const hasExportDefault = /export\s+default\s+function\s+App/.test(code);

    if (!hasExportDefault) {
      // Find where the function App starts
      const functionMatch = code.match(/(^|\n)(function\s+App\s*\()/);
      if (functionMatch && functionMatch.index !== undefined) {
        const beforeFunction = code.substring(0, functionMatch.index + (functionMatch[1] ? functionMatch[1].length : 0));
        const fromFunction = code.substring(functionMatch.index + (functionMatch[1] ? functionMatch[1].length : 0));
        code = beforeFunction + 'export default ' + fromFunction;
        logger.debug('Added export default to function App');
      } else {
        console.warn('Could not find function App to add export default');
      }
    }

    // Use GeminiCodeFixer for comprehensive syntax error detection and fixing
    console.log('🔧 Running GeminiCodeFixer for comprehensive error detection...');

    // Log React analysis BEFORE fixes
    console.log('🔍 React Analysis Before Fixes:');
    const hasReactImportBefore = /^import\s+React\s+from\s+['"]react['"]/m.test(code);
    const reactUseStateBefore = (code.match(/React\.useState/g) || []).length;
    const bareUseStateBefore = (code.match(/(?<!React\.)useState\(/g) || []).length;
    console.log(`  - Has React import: ${hasReactImportBefore}`);
    console.log(`  - React.useState count: ${reactUseStateBefore}`);
    console.log(`  - Bare useState count: ${bareUseStateBefore}`);
    console.log(`  - Code snippet (first 200 chars):`);
    console.log(`    ${code.substring(0, 200).replace(/\n/g, '\\n')}`);

    const result = codeFixer.fixCode(code);

    // Log React analysis AFTER fixes
    console.log('🔍 React Analysis After Fixes:');
    const reactUseStateAfter = (result.fixedCode.match(/React\.useState/g) || []).length;
    const bareUseStateAfter = (result.fixedCode.match(/(?<!React\.)useState\(/g) || []).length;
    console.log(`  - React.useState count: ${reactUseStateAfter}`);
    console.log(`  - Bare useState count: ${bareUseStateAfter}`);
    console.log(`  - Code snippet (first 200 chars):`);
    console.log(`    ${result.fixedCode.substring(0, 200).replace(/\n/g, '\\n')}`);

    // Check for multiplied React prefix (bug detection)
    if (result.fixedCode.includes('React.React.')) {
      console.error('🚨 BUG DETECTED: Multiplied React prefix found!');
      console.error('  This indicates GeminiCodeFixer is broken');
      console.error('  Example:', result.fixedCode.match(/React\.React\.[a-zA-Z]+/)?.[0]);
    }

    // Log the results
    if (result.errors.length > 0) {
      console.log(`✅ GeminiCodeFixer detected and fixed ${result.errors.length} error(s):`);
      console.log('📊 Fix Statistics:', result.stats);

      // Log individual errors for debugging
      result.errors.forEach((error, idx) => {
        console.log(`  ${idx + 1}. ${error.type} at line ${error.line}:${error.column}`);
        console.log(`     ${error.message}`);
        if (error.snippet) {
          console.log(`     Snippet: ${error.snippet.substring(0, 60)}...`);
        }
        if (error.suggestedFix) {
          console.log(`     Fix: ${error.suggestedFix.substring(0, 60)}...`);
        }
      });
    } else {
      console.log('ℹ️ GeminiCodeFixer: No syntax errors detected');
    }

    if (!result.success) {
      console.warn('⚠️ GeminiCodeFixer encountered issues during fixing');
    }

    let finalCode = result.fixedCode;

    // HARD-CODED FAILSAFE: ALWAYS ensure React import is at the top
    // This is the absolute final guarantee that React import exists
    console.log('🔒 FAILSAFE: Ensuring React import exists...');

    const hasReactImport = /^import\s+React\s+from\s+['"]react['"]\s*;?/m.test(finalCode);

    if (!hasReactImport) {
      console.log('🔧 FAILSAFE ACTIVATED: Adding React import to top of file');

      // Remove any existing React imports (in case they're in wrong place)
      finalCode = finalCode.replace(/^import\s+React\s+from\s+['"]react['"]\s*;?\s*\n?/gm, '');

      // Remove "export default " prefix if code starts with it (we'll add it back correctly)
      if (finalCode.trim().startsWith('export default import')) {
        // CRITICAL FIX: Remove the broken "export default import React" pattern
        finalCode = finalCode.replace(/^\s*export\s+default\s+import\s+React\s+from\s+['"]react['"]\s*;?\s*\n?/gm, '');
      }

      // Ensure code starts with export default function App
      if (!finalCode.trim().startsWith('export default function App')) {
        console.warn('⚠️ Code does not start with "export default function App"');
      }

      // Add import at the very top
      finalCode = `import React from 'react';\n\n${finalCode.trim()}`;

      console.log('✅ FAILSAFE: React import added');
      console.log('📄 First 150 chars:', finalCode.substring(0, 150).replace(/\n/g, '\\n'));
    } else {
      console.log('✅ FAILSAFE: React import already present');
    }

    return finalCode;
  }

  private validateGeneratedCode(code: string): boolean {
    // Check 1: Must have export default function App (can have imports before it)
    if (!code.includes('export default function App')) {
      console.error('Code does not include "export default function App"');
      return false;
    }

    // Check 2: Check for balanced brackets with JSX awareness
    if (!this.hasBalancedBrackets(code)) {
      return false;
    }

    // Check 3: Must have return statement
    if (!code.includes('return')) {
      console.error('Code does not include return statement');
      return false;
    }

    // Check 4: No dangerous patterns
    const dangerousPatterns = [/eval\(/g, /<script/gi, /innerHTML/g];
    for (const pattern of dangerousPatterns) {
      if (pattern.test(code)) {
        console.error('Code contains dangerous pattern:', pattern);
        return false;
      }
    }

    return true;
  }

  private hasBalancedBrackets(code: string): boolean {
    // Remove strings and comments to avoid counting brackets inside them
    let cleanCode = code;

    // Remove string contents (keep quotes for structure)
    cleanCode = cleanCode.replace(/'[^'\\]*(\\.[^'\\]*)*'/g, "''");
    cleanCode = cleanCode.replace(/"[^"\\]*(\\.[^"\\]*)*"/g, '""');
    cleanCode = cleanCode.replace(/`[^`\\]*(\\.[^`\\]*)*`/g, '``');

    // Remove single-line comments
    cleanCode = cleanCode.replace(/\/\/.*$/gm, '');

    // Remove multi-line comments
    cleanCode = cleanCode.replace(/\/\*[\s\S]*?\*\//g, '');

    const openBraces = (cleanCode.match(/\{/g) || []).length;
    const closeBraces = (cleanCode.match(/\}/g) || []).length;
    const openParens = (cleanCode.match(/\(/g) || []).length;
    const closeParens = (cleanCode.match(/\)/g) || []).length;
    const openBrackets = (cleanCode.match(/\[/g) || []).length;
    const closeBrackets = (cleanCode.match(/\]/g) || []).length;

    if (openBraces !== closeBraces) {
      console.error(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      return false;
    }
    if (openParens !== closeParens) {
      console.error(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
      return false;
    }
    if (openBrackets !== closeBrackets) {
      console.error(`Unbalanced square brackets: ${openBrackets} open, ${closeBrackets} close`);
      return false;
    }

    return true;
  }

  /**
   * Validates raw Gemini API response before cleanup/processing
   * Returns validation result with specific failure reasons for debugging
   */
  private validateGeminiResponse(rawCode: string): { isValid: boolean; reason: string } {
    logger.debug('Validating Gemini response');

    // Trim whitespace for checks
    const code = rawCode.trim();

    // Check 1: Response is not empty
    if (!code || code.length < 50) {
      return {
        isValid: false,
        reason: `Response too short (${code.length} chars) - likely truncated or empty`
      };
    }

    // Check 2: Must contain function declaration (allow various formats)
    const hasFunctionDeclaration =
      code.includes('function App') ||
      code.includes('const App =') ||
      code.includes('export default');

    if (!hasFunctionDeclaration) {
      return {
        isValid: false,
        reason: 'No function declaration found - response may be incomplete'
      };
    }

    // Check 3: Must have return statement
    if (!code.includes('return')) {
      return {
        isValid: false,
        reason: 'No return statement found - component incomplete'
      };
    }

    // Check 4: Check for basic bracket balance (quick check)
    const openBraces = (code.match(/\{/g) || []).length;
    const closeBraces = (code.match(/\}/g) || []).length;
    const braceDiff = Math.abs(openBraces - closeBraces);

    if (braceDiff > 2) { // Allow small discrepancies in strings
      return {
        isValid: false,
        reason: `Severely unbalanced braces: ${openBraces} open, ${closeBraces} close (diff: ${braceDiff})`
      };
    }

    // Check 5: Check for JSX tag balance (basic check)
    // Look for obvious unclosed tags
    const jsxOpenTags = code.match(/<([A-Z][a-zA-Z0-9]*)[^>]*>/g) || [];
    const jsxCloseTags = code.match(/<\/([A-Z][a-zA-Z0-9]*)>/g) || [];

    // Self-closing tags don't need closing tags
    const selfClosingTags = code.match(/<([A-Z][a-zA-Z0-9]*)[^>]*\/>/g) || [];

    const openTagCount = jsxOpenTags.length - selfClosingTags.length;
    const closeTagCount = jsxCloseTags.length;
    const tagDiff = Math.abs(openTagCount - closeTagCount);

    if (tagDiff > 1) { // Allow 1 tag discrepancy for edge cases
      return {
        isValid: false,
        reason: `Unbalanced JSX tags: ${openTagCount} opening, ${closeTagCount} closing (diff: ${tagDiff})`
      };
    }

    // Check 6: Detect truncation - check if ends mid-statement
    const trimmedEnd = code.trimEnd();
    const lastChars = trimmedEnd.slice(-50);

    // Signs of truncation: ends with incomplete syntax
    const truncationPatterns = [
      /[,;]\s*$/, // Ends with comma or semicolon (incomplete)
      /=\s*$/, // Ends with assignment operator
      /\(\s*$/, // Ends with opening paren
      /\[\s*$/, // Ends with opening bracket
      /:\s*$/, // Ends with colon
      /\|\|\s*$/, // Ends with logical operator
      /&&\s*$/, // Ends with logical operator
      /\+\s*$/, // Ends with math operator
      /-\s*$/, // Ends with math operator
    ];

    for (const pattern of truncationPatterns) {
      if (pattern.test(lastChars)) {
        return {
          isValid: false,
          reason: `Response appears truncated - ends with incomplete statement: "${lastChars.slice(-20)}"`
        };
      }
    }

    // Check 7: Must end with closing brace (function closing)
    if (!trimmedEnd.endsWith('}')) {
      return {
        isValid: false,
        reason: `Response doesn't end with closing brace - last 30 chars: "${trimmedEnd.slice(-30)}"`
      };
    }

    // Check 8: Should have JSX elements
    const hasJSXElements = /<[a-zA-Z]/.test(code);
    if (!hasJSXElements) {
      return {
        isValid: false,
        reason: 'No JSX elements found - component may be incomplete'
      };
    }

    // All checks passed
    logger.debug('Gemini response validation passed');
    return {
      isValid: true,
      reason: 'Response appears complete and well-formed'
    };
  }

  private getFallbackComponent(description: string): string {
    return `import React from 'react';

export default function App() {
  const [message, setMessage] = React.useState('Welcome to ${description}!');

  return (
    <div className="p-6 max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">${description}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => setMessage('App is working!')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Click Me
        </button>
      </div>
    </div>
  );
}`;
  }

  async fixBrokenComponent(
    brokenCode: string,
    errors: string[],
    originalDescription: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const maxRetries = 2;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const errorList = errors.map((err, idx) => `${idx + 1}. ${err}`).join('\n');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 120 seconds (2 minutes)

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `═══════════════════════════════════════════════════════════
🚨 YOUR FIXED CODE IS BROKEN WITHOUT THIS FIRST LINE 🚨
═══════════════════════════════════════════════════════════

Line 1 MUST be: import React from 'react';
Line 2: blank line
Line 3: export default function App() {

WITHOUT THE IMPORT, FIXED CODE WILL CRASH: "React is not defined"

YOUR FIRST LINE OF OUTPUT:
import React from 'react';

═══════════════════════════════════════════════════════════

The following React component has runtime errors. Please fix ALL the errors and return the corrected code.

START YOUR FIXED CODE WITH:
import React from 'react';

ORIGINAL APP DESCRIPTION: ${originalDescription}

BROKEN CODE:
\`\`\`javascript
${brokenCode}
\`\`\`

RUNTIME ERRORS DETECTED:
${errorList}

CRITICAL INSTRUCTIONS:
- FIRST LINE: import React from 'react';
- SECOND LINE: blank
- THIRD LINE: export default function App() {
- Fix ALL the errors listed above
- MUST use "React.useState" and "React.useEffect" (with React prefix) for all hooks
- Use Tailwind CSS classes for styling (no custom CSS)
- Return ONLY the fixed JavaScript code, NO explanations or markdown
- Do NOT write any text before the import statement
- All brackets, parentheses, and braces MUST be properly balanced
- All strings must be properly quoted
- No syntax errors - the code must execute immediately
- Make sure all variables are properly defined before use
- Ensure all functions are defined before being called
- Fix any typos in variable or function names

TEMPLATE LITERAL RULES (CRITICAL - THIS IS LIKELY THE ERROR):
- When using variables in className, ALWAYS use backticks around the ENTIRE string
- CORRECT: className={\`flex gap-2 \${active ? 'bg-blue-500' : 'bg-gray-500'}\`}
- WRONG: className={flex gap-2 \${active ? 'bg-blue-500' : 'bg-gray-500'}}
- CORRECT: style={{ width: \`\${percentage}%\` }}
- WRONG: style={{ width: \${percentage}% }}
- If className has ANY \${} inside it, wrap the WHOLE string in backticks
- Static classNames (no variables) should use regular quotes: className="flex gap-2"
- If you see "Unexpected token" error with className, add backticks around the entire className value

FORBIDDEN:
- Do NOT use any import statements
- Do NOT use require() statements
- Do NOT use eval, innerHTML, or script tags
- Do NOT use plain useState/useEffect without React prefix
- Do NOT include markdown code blocks or backticks in your response
- Do NOT include any explanatory text
- Do NOT EVER write className={text \${variable}...} - this is a SYNTAX ERROR
- NEVER use \${} without wrapping the entire string in backticks

Return ONLY the complete, fixed, working code that will run without errors.`
                }]
              }]
            })
          }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
          let code = data.candidates[0].content.parts[0].text;

          // Clean up the code
          code = this.cleanupGeneratedCode(code);

          // Validate the fixed code
          if (this.validateGeneratedCode(code)) {
            logger.success(`Successfully fixed component on attempt ${attempt + 1}`);
            return code;
          } else if (attempt < maxRetries - 1) {
            logger.warn(`Fixed code invalid on attempt ${attempt + 1}, retrying`);
            continue;
          }
        }

        if (attempt === maxRetries - 1) {
          throw new Error('Failed to generate valid fixed code after all retries');
        }
      } catch (error) {
        // Check if it's an abort/timeout error
        const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));

        if (isTimeout) {
          logger.error(`Request timeout on attempt ${attempt + 1}/${maxRetries} - Gemini API took longer than 120 seconds`, error);
        } else {
          logger.error(`Error fixing component (attempt ${attempt + 1})`, error);
        }

        if (attempt === maxRetries - 1) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (isTimeout) {
            throw new Error(`Gemini API timeout: The request took longer than 2 minutes. The component may be too complex to fix automatically.`);
          }
          throw new Error(`Failed to fix component: ${errorMessage}`);
        }
      }
    }

    throw new Error('Failed to fix component after all retry attempts');
  }

  async updateComponent(
    currentCode: string,
    updatePrompt: string,
    originalDescription: string
  ): Promise<string> {
    const apiKey = this.getApiKey();
    const maxRetries = 2;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // Increased to 120 seconds (2 minutes)

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-preview:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: `═══════════════════════════════════════════════════════════
🚨 YOUR CODE IS BROKEN WITHOUT THIS FIRST LINE 🚨
═══════════════════════════════════════════════════════════

Line 1 MUST be: import React from 'react';
Line 2: blank line
Line 3: export default function App() {

WITHOUT THE IMPORT, CODE WILL CRASH: "React is not defined"

YOUR FIRST LINE OF OUTPUT:
import React from 'react';

═══════════════════════════════════════════════════════════

You are updating an existing React component. Keep all existing functionality and add the requested features.

ORIGINAL APP DESCRIPTION: ${originalDescription}

CURRENT CODE:
\`\`\`javascript
${currentCode}
\`\`\`

UPDATE REQUEST:
${updatePrompt}

INSTRUCTIONS:
1. FIRST LINE: import React from 'react';
2. SECOND LINE: blank
3. THIRD LINE: export default function App() {
4. Keep ALL existing functionality from the current code
5. Add the requested features described in the update request
6. Use React.useState, React.useEffect (with React prefix) for all hooks
7. Use Tailwind CSS classes for styling
8. Return ONLY the updated JavaScript code, NO explanations
9. Make sure the updated component is fully functional

Return ONLY the complete, updated, working code.`
                }]
              }]
            })
          }
        );

        clearTimeout(timeoutId);
        const data = await response.json();

        if (data.candidates && data.candidates[0]) {
          let code = data.candidates[0].content.parts[0].text;

          // Clean up the code
          code = this.cleanupGeneratedCode(code);

          // Validate the updated code
          if (this.validateGeneratedCode(code)) {
            logger.success(`Successfully updated component on attempt ${attempt + 1}`);
            return code;
          } else if (attempt < maxRetries - 1) {
            logger.warn(`Updated code invalid on attempt ${attempt + 1}, retrying`);
            continue;
          }
        }

        if (attempt === maxRetries - 1) {
          throw new Error('Failed to generate valid updated code after all retries');
        }
      } catch (error) {
        // Check if it's an abort/timeout error
        const isTimeout = error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'));

        if (isTimeout) {
          logger.error(`Request timeout on attempt ${attempt + 1}/${maxRetries} - Gemini API took longer than 120 seconds`, error);
        } else {
          logger.error(`Error updating component (attempt ${attempt + 1})`, error);
        }

        if (attempt === maxRetries - 1) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          if (isTimeout) {
            throw new Error(`Gemini API timeout: The request took longer than 2 minutes. Please try again with a simpler update request.`);
          }
          throw new Error(`Failed to update component: ${errorMessage}`);
        }
      }
    }

    throw new Error('Failed to update component after all retry attempts');
  }
}

export const GeminiService = new GeminiServiceClass();
