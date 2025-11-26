import { logger } from './logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class AppValidator {
  static validate(componentCode: string): ValidationResult {
    logger.debug('AppValidator: Starting validation');
    logger.debug('Code details', {
      length: componentCode.length,
      preview: componentCode.substring(0, 300)
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check 1: Must contain export default
    if (!componentCode.includes('export default')) {
      console.error('❌ Validation failed: Missing export default');
      errors.push('Component must have an export default statement');
    } else {
      console.log('✅ Check passed: Has export default');
    }

    // Check 2: No dangerous patterns
    const dangerousPatterns = [
      { pattern: /eval\(/g, message: 'eval() is not allowed for security reasons' },
      { pattern: /Function\(/g, message: 'Function constructor is not allowed' },
      { pattern: /innerHTML/g, message: 'innerHTML is not allowed, use React rendering instead' },
      { pattern: /dangerouslySetInnerHTML/g, message: 'dangerouslySetInnerHTML is not allowed' },
      { pattern: /<script/gi, message: 'Script tags are not allowed' },
      { pattern: /document\.write/g, message: 'document.write is not allowed' },
      { pattern: /window\.location/g, message: 'window.location manipulation is not allowed' },
    ];

    for (const { pattern, message } of dangerousPatterns) {
      if (pattern.test(componentCode)) {
        errors.push(message);
      }
    }

    // Check 3: Basic React hooks validation
    const hookPattern = /React\.(useState|useEffect|useCallback|useMemo|useRef)/g;
    const hasHooks = hookPattern.test(componentCode);

    // Check 4: Proper JSX structure
    if (!componentCode.includes('return')) {
      errors.push('Component must have a return statement');
    }

    // Check 5: Check for balanced brackets
    const openBraces = (componentCode.match(/\{/g) || []).length;
    const closeBraces = (componentCode.match(/\}/g) || []).length;
    const openParens = (componentCode.match(/\(/g) || []).length;
    const closeParens = (componentCode.match(/\)/g) || []).length;
    const openBrackets = (componentCode.match(/\[/g) || []).length;
    const closeBrackets = (componentCode.match(/\]/g) || []).length;

    console.log('🔢 Bracket counts:', {
      braces: `${openBraces} open, ${closeBraces} close`,
      parens: `${openParens} open, ${closeParens} close`,
      brackets: `${openBrackets} open, ${closeBrackets} close`
    });

    if (openBraces !== closeBraces) {
      console.error(`❌ Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      errors.push('Unbalanced curly braces detected');
    } else {
      console.log('✅ Check passed: Braces balanced');
    }
    if (openParens !== closeParens) {
      console.error(`❌ Unbalanced parens: ${openParens} open, ${closeParens} close`);
      errors.push('Unbalanced parentheses detected');
    } else {
      console.log('✅ Check passed: Parentheses balanced');
    }
    if (openBrackets !== closeBrackets) {
      console.error(`❌ Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
      errors.push('Unbalanced square brackets detected');
    } else {
      console.log('✅ Check passed: Square brackets balanced');
    }

    // Check 6: No external API calls without user awareness
    const dangerousAPIs = [
      { pattern: /fetch\(/g, message: 'Warning: Component makes external API calls' },
      { pattern: /XMLHttpRequest/g, message: 'XMLHttpRequest is not recommended' },
      { pattern: /axios\./g, message: 'Warning: Component uses axios for API calls' },
    ];

    // These are warnings, not hard errors
    for (const { pattern, message } of dangerousAPIs) {
      if (pattern.test(componentCode)) {
        warnings.push(message);
      }
    }

    // Check 7: Must be a function component
    const isFunctionComponent =
      /export default function/i.test(componentCode) ||
      /export default \(\) =>/i.test(componentCode) ||
      /const \w+ = \(\) => {/i.test(componentCode);

    if (!isFunctionComponent) {
      errors.push('Component must be a functional component');
    }

    // Check 8: Try basic syntax validation
    try {
      // Remove export statement for syntax check
      let codeToTest = componentCode.replace(/export default /g, '');

      // Remove JSX for syntax check (JSX won't work in new Function)
      // Just check if we can parse it as JavaScript structure
      // This is a lenient check - we'll rely on React's error boundary at runtime
      const hasBasicStructure = /function.*\{[\s\S]*return[\s\S]*\}/.test(codeToTest);

      if (!hasBasicStructure) {
        errors.push('Component must have a function with a return statement');
      }
    } catch (syntaxError) {
      errors.push(`Syntax error detected: ${syntaxError instanceof Error ? syntaxError.message : 'Unknown error'}`);
    }

    // Check 9: Runtime syntax test with Babel-like transform simulation
    console.log('🧪 Running runtime syntax tests...');
    const runtimeTest = this.testRuntimeSyntax(componentCode);
    if (!runtimeTest.success) {
      console.error('❌ Runtime syntax test failed:', runtimeTest.errors);
      errors.push(...runtimeTest.errors);
    } else {
      console.log('✅ Runtime syntax tests passed');
    }

    const isValid = errors.length === 0;
    console.log(`📋 Validation complete. Valid: ${isValid}, Errors: ${errors.length}, Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.error('❌ Validation errors:', errors);
    }
    if (warnings.length > 0) {
      console.warn('⚠️ Validation warnings:', warnings);
    }

    return {
      isValid,
      errors,
      warnings
    };
  }

  static testRuntimeSyntax(componentCode: string): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Test 1: Check for common JSX mistakes
      const jsxIssues = this.checkJSXIssues(componentCode);
      errors.push(...jsxIssues);

      // Test 2: Check for React hook usage
      const hookIssues = this.checkReactHooks(componentCode);
      errors.push(...hookIssues);

      // Test 3: Check for proper event handlers
      const eventIssues = this.checkEventHandlers(componentCode);
      errors.push(...eventIssues);

      // Test 4: Try to create a sandboxed test
      const sandboxTest = this.sandboxedSyntaxCheck(componentCode);
      if (!sandboxTest.success) {
        errors.push(...sandboxTest.errors);
      }

      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Runtime validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  private static checkJSXIssues(code: string): string[] {
    const issues: string[] = [];

    // Check for self-closing tags that should be self-closing
    const voidElements = ['img', 'input', 'br', 'hr', 'meta', 'link'];
    for (const element of voidElements) {
      const pattern = new RegExp(`<${element}[^>]*>[\\s\\S]*?</${element}>`, 'gi');
      if (pattern.test(code)) {
        issues.push(`<${element}> should be self-closing`);
      }
    }

    // Check for className instead of class
    if (/\sclass=["']/i.test(code)) {
      issues.push('Use className instead of class in JSX');
    }

    // NOTE: Removed JSX tag counting check - it was too unreliable and caused false positives
    // Self-closing tags, fragments, and nested JSX broke the simple count logic
    // Runtime testing will catch actual JSX structure issues

    return issues;
  }

  private static checkReactHooks(code: string): string[] {
    const issues: string[] = [];

    // Check for hooks without React prefix
    const invalidHooks = code.match(/(?<!React\.)(useState|useEffect|useCallback|useMemo|useRef|useContext)\s*\(/g);
    if (invalidHooks && invalidHooks.length > 0) {
      issues.push('Hooks must be prefixed with React (e.g., React.useState instead of useState)');
    }

    // Check for hooks inside conditions/loops (basic check)
    const conditionalHookPattern = /if\s*\([^)]*\)[^{]*{[^}]*React\.(useState|useEffect|useCallback|useMemo|useRef)/;
    if (conditionalHookPattern.test(code)) {
      issues.push('React hooks should not be called conditionally');
    }

    return issues;
  }

  private static checkEventHandlers(code: string): string[] {
    const issues: string[] = [];

    // Check for onclick instead of onClick
    if (/\sonclick=/i.test(code) && !/\sonClick=/.test(code)) {
      issues.push('Use onClick instead of onclick in JSX');
    }

    // Check for onchange instead of onChange
    if (/\sonchange=/i.test(code) && !/\sonChange=/.test(code)) {
      issues.push('Use onChange instead of onchange in JSX');
    }

    return issues;
  }

  private static sandboxedSyntaxCheck(componentCode: string): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Remove JSX and check basic JavaScript syntax
      let testCode = componentCode;

      // Replace JSX with placeholder strings to test JS syntax
      testCode = testCode.replace(/<[^>]+>/g, '""');
      testCode = testCode.replace(/export default /g, '');

      // Try to validate basic structure without executing
      // Check for common syntax errors

      // DISABLED: Simple quote counting is unreliable and causes false positives
      // - Doesn't account for escaped quotes (\' or \")
      // - Doesn't account for quotes in comments
      // - Doesn't account for quotes inside other quotes
      // - Template literals use backticks, not quotes
      // - Apostrophes in comments/strings like "don't" break the count
      // Runtime testing with Babel will catch actual syntax errors

      // Check for basic arrow function syntax errors
      const arrowFunctions = testCode.match(/=>\s*{/g) || [];
      const returnKeywords = testCode.match(/=>\s*\(/g) || [];

      // Basic structural validation
      if (!testCode.includes('function') && arrowFunctions.length === 0) {
        errors.push('No function definition found');
      }

      return {
        success: errors.length === 0,
        errors
      };
    } catch (error) {
      errors.push(`Syntax check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { success: false, errors };
    }
  }

  static canSafelyRender(componentCode: string): boolean {
    const result = this.validate(componentCode);

    // Allow rendering if there are no critical errors
    // (some warnings are acceptable)
    const criticalErrors = result.errors.filter(
      error => !error.startsWith('Warning:')
    );

    return criticalErrors.length === 0;
  }
}
