/**
 * CodeFixer - Automatically fixes common syntax errors in AI-generated React code
 * This is a post-processing step that patches known issues without relying on AI
 */

export class CodeFixer {
  /**
   * Main entry point - fixes all known issues in the generated code
   */
  static fixAll(code: string): string {
    console.log('🔧 CodeFixer: Starting auto-fix...');
    let fixed = code;

    // Apply all fixes in sequence
    console.log('  - Fixing className template literals...');
    fixed = this.fixTemplateListInClassName(fixed);

    console.log('  - Fixing style template literals...');
    fixed = this.fixTemplateListInStyle(fixed);

    console.log('  - Fixing nested template literals...');
    fixed = this.fixNestedTemplateLiterals(fixed);

    console.log('  - Ensuring proper quoting...');
    fixed = this.ensureProperQuoting(fixed);

    const analysis = this.analyze(code, fixed);
    if (analysis.hasChanges) {
      console.log('✅ CodeFixer applied changes:', analysis.changes);
    } else {
      console.log('ℹ️ CodeFixer: No changes needed');
    }

    return fixed;
  }

  /**
   * Fix template literals in className attributes
   * Converts: className={text ${var} text}
   * To: className={`text ${var} text`}
   */
  private static fixTemplateListInClassName(code: string): string {
    // Strategy: Look for className={ and parse until we find the matching }
    // Check if it has ${} interpolation but is NOT wrapped in backticks

    const regex = /className=\{/g;
    let result = code;
    let match;

    // We need to track positions since we're modifying the string
    const fixes: Array<{start: number; end: number; replacement: string}> = [];

    while ((match = regex.exec(code)) !== null) {
      const startPos = match.index + match[0].length; // Position after 'className={'

      // Find the matching closing brace
      let braceCount = 1;
      let endPos = startPos;
      let hasInterpolation = false;
      let startsWithBacktick = false;

      // Check if it starts with a backtick
      if (code[startPos] === '`') {
        startsWithBacktick = true;
      }

      // Parse until we find the matching }
      while (endPos < code.length && braceCount > 0) {
        const char = code[endPos];

        if (char === '{') braceCount++;
        if (char === '}') braceCount--;

        // Check for interpolation
        if (char === '$' && code[endPos + 1] === '{') {
          hasInterpolation = true;
        }

        endPos++;
      }

      endPos--; // Back up to the closing brace

      const content = code.substring(startPos, endPos);

      // Only fix if: has interpolation AND doesn't start with backtick
      if (hasInterpolation && !startsWithBacktick) {
        console.log('🔧 Fixing className (adding backticks):', content.substring(0, 50));
        fixes.push({
          start: match.index,
          end: endPos + 1,
          replacement: `className={\`${content}\`}`
        });
      }
    }

    // Apply fixes in reverse order to maintain positions
    for (let i = fixes.length - 1; i >= 0; i--) {
      const fix = fixes[i];
      result = result.substring(0, fix.start) + fix.replacement + result.substring(fix.end);
    }

    return result;
  }

  /**
   * Fix template literals in style objects
   * Converts: style={{ width: ${x}% }}
   * To: style={{ width: `${x}%` }}
   */
  private static fixTemplateListInStyle(code: string): string {
    // Look for style={{ ... }} objects and fix template literals inside them
    // This is more precise than looking for any property:value pattern

    const styleObjectPattern = /style=\{\{([^}]+)\}\}/g;
    let result = code;
    const fixes: Array<{start: number; end: number; replacement: string}> = [];

    let match;
    while ((match = styleObjectPattern.exec(code)) !== null) {
      const styleContent = match[1];
      const styleStart = match.index;

      // Parse individual properties within the style object
      const propertyPattern = /(\w+):\s*([^,}]+?)(?=\s*[,}])/g;
      let propMatch;
      const styleFixes: Array<{offset: number; length: number; replacement: string}> = [];

      while ((propMatch = propertyPattern.exec(styleContent)) !== null) {
        const prop = propMatch[1];
        const value = propMatch[2].trim();

        // Only fix if: has interpolation AND doesn't start with backtick
        if (value.includes('${') && !value.startsWith('`')) {
          console.log('🔧 Fixing style (adding backticks):', `${prop}: ${value.substring(0, 30)}`);
          styleFixes.push({
            offset: propMatch.index,
            length: propMatch[0].length,
            replacement: `${prop}: \`${value}\``
          });
        }
      }

      // Apply style fixes in reverse order
      if (styleFixes.length > 0) {
        let newStyleContent = styleContent;
        for (let i = styleFixes.length - 1; i >= 0; i--) {
          const fix = styleFixes[i];
          newStyleContent = newStyleContent.substring(0, fix.offset) + fix.replacement + newStyleContent.substring(fix.offset + fix.length);
        }

        fixes.push({
          start: styleStart,
          end: styleStart + match[0].length,
          replacement: `style={{${newStyleContent}}}`
        });
      }
    }

    // Apply fixes in reverse order
    for (let i = fixes.length - 1; i >= 0; i--) {
      const fix = fixes[i];
      result = result.substring(0, fix.start) + fix.replacement + result.substring(fix.end);
    }

    return result;
  }

  /**
   * Fix nested template literals in ternary expressions
   * Converts: className={text ${x ? ${a} : ${b}}}
   * To: className={`text ${x ? a : b}`}
   */
  private static fixNestedTemplateLiterals(code: string): string {
    // This is a complex pattern - find className/style with nested ${}
    // For now, we'll use a simple approach: if we see ${ inside ${}, remove the inner ones

    // Find all template literal-like expressions
    let fixed = code;
    let changed = true;
    let iterations = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (changed && iterations < maxIterations) {
      changed = false;
      iterations++;

      // Pattern: ${...${...}...} - nested template expressions
      const nestedPattern = /\$\{([^}]*)\$\{([^}]*)\}([^}]*)\}/g;

      const newCode = fixed.replace(nestedPattern, (_match, before, inner, after) => {
        changed = true;
        // Remove the inner ${}
        return `\${${before}${inner}${after}}`;
      });

      fixed = newCode;
    }

    return fixed;
  }

  /**
   * Ensure strings are properly quoted
   * This is a safety check for any unquoted strings
   */
  private static ensureProperQuoting(code: string): string {
    // This is tricky - we don't want to break valid code
    // For now, just return as-is
    // We could add more sophisticated checks later
    return code;
  }

  /**
   * Diagnostic method - returns info about what was fixed
   */
  static analyze(original: string, fixed: string): {
    hasChanges: boolean;
    changes: string[];
  } {
    const changes: string[] = [];

    if (original !== fixed) {
      // Count differences - using \x60 for backtick to avoid escaping issues
      const classNameMatches = (original.match(/className=\{[^\x60][^}]*\$\{/g) || []).length;
      if (classNameMatches > 0) {
        changes.push(`Fixed ${classNameMatches} className template literal(s)`);
      }

      const styleMatches = (original.match(/\w+:\s*[^\x60'"{\s][^,}]*\$\{/g) || []).length;
      if (styleMatches > 0) {
        changes.push(`Fixed ${styleMatches} style template literal(s)`);
      }
    }

    return {
      hasChanges: original !== fixed,
      changes
    };
  }
}
