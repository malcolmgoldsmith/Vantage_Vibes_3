// GeminiCodeFixer.ts - Comprehensive error detection and fixing system

interface ErrorPattern {
  name: string;
  pattern: RegExp;
  fix: (match: string, ...groups: string[]) => string;
  test?: string; // Test case to verify the fix works
  severity: 'error' | 'warning';
}

interface DetectedError {
  type: string;
  line: number;
  column: number;
  message: string;
  snippet: string;
  suggestedFix?: string;
}

export class GeminiCodeFixer {
  private fixStats: Map<string, number> = new Map();
  private detectedErrors: DetectedError[] = [];
  private fixLog: string[] = [];

  // Define all known error patterns
  private errorPatterns: ErrorPattern[] = [
    // ============ TEMPLATE LITERAL ERRORS ============
    {
      name: 'percent_outside_backticks',
      pattern: /`\$\{([^}]+)\}`([%])/g,
      fix: (match, variable, unit) => `\`\${${variable}}${unit}\``,
      test: 'style={{ width: `${value}`% }}',
      severity: 'error'
    },
    {
      name: 'px_outside_backticks',
      pattern: /`\$\{([^}]+)\}`(px|rem|em|vh|vw)/g,
      fix: (match, variable, unit) => `\`\${${variable}}${unit}\``,
      test: 'style={{ height: `${height}`px }}',
      severity: 'error'
    },
    {
      name: 'className_missing_backticks',
      pattern: /className=\{([^`{][^}]*?\$\{[^}]*\}[^}]*?)\}/g,
      fix: (match, content) => {
        if (content.includes('`')) return match;
        return `className={\`${content}\`}`;
      },
      test: 'className={text-lg ${isActive ? "active" : ""}}',
      severity: 'error'
    },
    {
      name: 'jsx_text_with_interpolation',
      pattern: />([^<{]+\$\{[^}]+\}[^<{]*)</g,
      fix: (match, content) => {
        if (content.includes('`') || content.trim() === '') return match;
        return `>{\`${content.trim()}\`}<`;
      },
      test: '<div>Hello ${name}!</div>',
      severity: 'error'
    },
    {
      name: 'jsx_curly_brace_template_literal',
      pattern: /className=\{([^`][^}]*\$\{[^}]*?\}[^}]*)\}/g,
      fix: (match, content) => {
        // This catches className={text ${var}} without backticks
        // Convert to: className={`text ${var}`}
        if (content.includes('`')) return match; // Already has backticks
        return `className={\`${content}\`}`;
      },
      test: 'className={text ${isActive ? "active" : ""}}',
      severity: 'error'
    },
    // nested_backticks pattern removed - was causing false positives by merging lines
    {
      name: 'identifier_with_backtick_interpolation',
      pattern: /([A-Z][a-zA-Z]*)`\$\{([^}]+)\}`/g,
      fix: (match, identifier, variable) => `\`${identifier}\${${variable}}\``,
      test: 'User`${id}`',
      severity: 'error'
    },
    {
      name: 'ternary_missing_backticks',
      pattern: /\?\s*([^`'"{}\s][^:]*\$\{[^}]+\}[^:]*)\s*:/g,
      fix: (match, content) => {
        if (content.includes('`')) return match;
        return `? \`${content}\` :`;
      },
      test: 'winner ? ${winner} wins : "Draw"',
      severity: 'error'
    },
    {
      name: 'style_value_missing_backticks',
      pattern: /style=\{\{([^}]+)\}\}/g,
      fix: (match, styleContent) => {
        const fixed = styleContent.replace(
          /(\w+):\s*([^`'",{}][^,}]*?\$\{[^}]*?\}[^,}]*?)(?=[,}])/g,
          (m, prop, value) => {
            if (value.includes('`')) return m;
            return `${prop}: \`${value.trim()}\``;
          }
        );
        return `style={{${fixed}}}`;
      },
      test: 'style={{ width: ${width}%, height: ${height}px }}',
      severity: 'error'
    },

    // ============ MISSING OPERATORS ============
    {
      name: 'missing_multiplication_after_random',
      pattern: /Math\.random\(\)\s+([a-zA-Z_$][\w$.\[\]]*)/g,
      fix: (match, variable) => `Math.random() * ${variable}`,
      test: 'Math.random()  array.length',
      severity: 'error'
    },
    {
      name: 'missing_multiplication_after_paren',
      pattern: /\)\s{2,}(\d+)/g,
      fix: (match, number) => `) * ${number}`,
      test: '(a + b)  2',
      severity: 'error'
    },
    {
      name: 'missing_multiplication_decimals',
      pattern: /(\d+\.\d+)\s{2,}([a-zA-Z_$][\w]*)/g,
      fix: (match, decimal, variable) => `${decimal} * ${variable}`,
      test: '1.5  deltaTime',
      severity: 'error'
    },
    {
      name: 'missing_multiplication_identifier_number',
      pattern: /([a-zA-Z_$][\w]*)\s{2,}(\d+)(?!\w)/g,
      fix: (match, identifier, number) => `${identifier} * ${number}`,
      test: 'value  100',
      severity: 'error'
    },
    {
      name: 'missing_operator_array_access',
      pattern: /\[([a-zA-Z_$][\w]*)\s{2,}(\d+)\]/g,
      fix: (match, variable, number) => `[${variable} * ${number}]`,
      test: 'array[index  1]',
      severity: 'error'
    },

    // ============ JSX SPECIFIC ERRORS ============
    {
      name: 'broken_jsx_comment',
      pattern: /\{\/\s*(.*?)\s*\/\}/g,
      fix: (match, comment) => `{/* ${comment} */}`,
      test: '{/ This is a comment /}',
      severity: 'error'
    },
    {
      name: 'jsx_expression_missing_braces',
      pattern: /=\s*([^{"][^=\s>]*\$\{[^}]+\}[^"\s>]*)\s*(?=[>\/])/g,
      fix: (match, content) => {
        if (content.startsWith('{')) return match;
        return `={\`${content}\`}`;
      },
      test: 'aria-label=Click ${count} times',
      severity: 'error'
    },
    {
      name: 'missing_space_before_static_class',
      pattern: /(\$\{[^}]+\})([a-zA-Z])/g,
      fix: (match, interpolation, nextChar) => `${interpolation} ${nextChar}`,
      test: 'className={`${isActive ? "active" : ""}text-lg`}',
      severity: 'warning'
    },

    // ============ LOGICAL ERRORS ============
    {
      name: 'undefined_React',
      pattern: /(?<!React\.)\b(useState|useEffect|useCallback|useMemo|useRef)\(/g,
      fix: (match, hook) => `React.${hook}(`,
      test: 'const [count, setCount] = useState(0)',
      severity: 'error'
    },
    {
      name: 'incorrect_fragment',
      pattern: /<>\s*<\/>/g,
      fix: () => '<React.Fragment></React.Fragment>',
      test: '<></>',
      severity: 'warning'
    }
  ];

  /**
   * Main entry point - detects and fixes all errors
   */
  public fixCode(code: string, description?: string): {
    fixedCode: string;
    errors: DetectedError[];
    stats: Record<string, number>;
    success: boolean;
  } {
    this.resetState();

    // Log initial code state for debugging (but don't skip fixing)
    const hasReactImport = /^import\s+React\s+from\s+['"]react['"]/m.test(code);
    const hasReactPrefix = /React\.(useState|useEffect|useCallback|useMemo|useRef)\(/.test(code);
    const isValidBeforeFix = this.validateCode(code);

    console.log('🔍 GeminiCodeFixer: Pre-check status:', {
      hasReactImport,
      hasReactPrefix,
      passesValidation: isValidBeforeFix
    });
    console.log('🔧 GeminiCodeFixer: Running all fix patterns (pre-check skip disabled)');

    let fixedCode = code;

    // First pass: Detect all errors
    this.detectErrors(code);

    // Apply each pattern ONLY ONCE (single pass to prevent multiplying fixes)
    console.log('🔧 GeminiCodeFixer: Applying fixes (single pass)...');

    for (const pattern of this.errorPatterns) {
      const beforeFix = fixedCode;
      fixedCode = fixedCode.replace(pattern.pattern, pattern.fix);

      if (beforeFix !== fixedCode) {
        const count = (beforeFix.match(pattern.pattern) || []).length;
        this.fixStats.set(pattern.name, count);
        this.fixLog.push(`Fixed ${count} instances of ${pattern.name}`);
      }
    }

    // Additional context-aware fixes
    fixedCode = this.applyContextAwareFixes(fixedCode);

    // Validate the fixed code
    const isValid = this.validateCode(fixedCode);

    // Convert Map to object for stats
    const stats: Record<string, number> = {};
    this.fixStats.forEach((count, name) => {
      stats[name] = count;
    });

    return {
      fixedCode,
      errors: this.detectedErrors,
      stats,
      success: isValid
    };
  }

  /**
   * Detect all errors in the code without fixing
   */
  private detectErrors(code: string): void {
    const lines = code.split('\n');

    for (const pattern of this.errorPatterns) {
      const matches = Array.from(code.matchAll(pattern.pattern));

      for (const match of matches) {
        const position = this.getLineColumn(code, match.index || 0);
        const snippet = this.getCodeSnippet(lines, position.line);

        this.detectedErrors.push({
          type: pattern.name,
          line: position.line,
          column: position.column,
          message: `${pattern.name}: ${match[0]}`,
          snippet,
          suggestedFix: pattern.fix(match[0], ...match.slice(1))
        });
      }
    }
  }

  /**
   * Apply more sophisticated context-aware fixes
   */
  private applyContextAwareFixes(code: string): string {
    // Fix 1: Handle complex className with multiple conditions
    code = this.fixComplexClassName(code);

    // Fix 2: Handle style objects with multiple dynamic properties
    code = this.fixComplexStyleObjects(code);

    // Fix 3: Fix JSX children with mixed text and expressions
    code = this.fixMixedJSXChildren(code);

    // Fix 4: Ensure all mathematical operations have operators
    code = this.ensureMathOperators(code);

    // Fix 5: Fix broken template literals in any context
    code = this.fixUniversalTemplateLiterals(code);

    return code;
  }

  private fixComplexClassName(code: string): string {
    // Match entire className attributes
    const classNameRegex = /className=\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;

    return code.replace(classNameRegex, (match, content) => {
      // If it has ${} and no backticks, add them
      if (content.includes('${') && !content.includes('`')) {
        return `className={\`${content}\`}`;
      }

      // Remove nested backticks
      let fixed = content;
      while (fixed.includes('`') && fixed.includes('`${')) {
        fixed = fixed.replace(/`([^`]*)`\$\{/g, '`$1${');
        fixed = fixed.replace(/\}`([^`]*)`/g, '}$1');
      }

      if (fixed !== content) {
        return `className={${fixed}}`;
      }

      return match;
    });
  }

  private fixComplexStyleObjects(code: string): string {
    const styleRegex = /style=\{\{([^}]+(?:\{[^}]*\}[^}]*)*)\}\}/g;

    return code.replace(styleRegex, (match, content) => {
      const properties = this.parseStyleProperties(content);
      const fixedProps = properties.map(prop => {
        if (prop.value.includes('${') && !prop.value.startsWith('`')) {
          return `${prop.name}: \`${prop.value}\``;
        }
        return `${prop.name}: ${prop.value}`;
      });

      return `style={{${fixedProps.join(', ')}}}`;
    });
  }

  private fixMixedJSXChildren(code: string): string {
    // Find JSX elements with mixed content
    const jsxChildrenRegex = />([^<]+)</g;

    return code.replace(jsxChildrenRegex, (match, content) => {
      // If content has ${} but no {}, wrap it
      if (content.includes('${') && !content.includes('{`')) {
        return `>{\`${content.trim()}\`}<`;
      }
      return match;
    });
  }

  private ensureMathOperators(code: string): string {
    // Pattern: number/identifier followed by 2+ spaces and another number/identifier
    const patterns = [
      // Parenthesis followed by spaces and number
      { regex: /\)\s{2,}(\d+)/g, replacement: ') * $1' },
      // Number with spaces then identifier
      { regex: /(\d+)\s{2,}([a-zA-Z_$][\w]*)/g, replacement: '$1 * $2' },
      // Identifier with spaces then number
      { regex: /([a-zA-Z_$][\w]*)\s{2,}(\d+)/g, replacement: '$1 * $2' },
      // Decimal with spaces then identifier
      { regex: /(\d+\.\d+)\s{2,}([a-zA-Z_$][\w]*)/g, replacement: '$1 * $2' }
    ];

    let result = code;
    for (const { regex, replacement } of patterns) {
      result = result.replace(regex, replacement);
    }

    return result;
  }

  private fixUniversalTemplateLiterals(code: string): string {
    // Universal pattern: ${...} not inside backticks
    // But be careful not to break valid JSX expressions

    // CRITICAL FIX: Only match content that does NOT contain { or } to avoid breaking
    // complex expressions with nested objects or functions (which would cause unbalanced braces)
    const dollarBraceRegex = /([^`]|^)\$\{([^{}]+)\}([^`]|$)/g;

    return code.replace(dollarBraceRegex, (match, before, content, after) => {
      // Skip if it's inside a JSX expression that's already valid
      if (before === '{' && after === '}') return match;

      // Skip if it looks like it's already in a template literal context
      if (before.endsWith('`') || after.startsWith('`')) return match;

      // Add backticks
      return `${before}\`\${${content}}\`${after}`;
    });
  }

  // ============ HELPER METHODS ============

  private getLineColumn(code: string, index: number): { line: number; column: number } {
    const lines = code.substring(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }

  private getCodeSnippet(lines: string[], lineNumber: number): string {
    const start = Math.max(0, lineNumber - 2);
    const end = Math.min(lines.length, lineNumber + 1);
    return lines.slice(start, end).join('\n');
  }

  private parseStyleProperties(styleContent: string): Array<{ name: string; value: string }> {
    const properties: Array<{ name: string; value: string }> = [];
    const propRegex = /(\w+):\s*([^,}]+)/g;
    let match;

    while ((match = propRegex.exec(styleContent)) !== null) {
      properties.push({ name: match[1], value: match[2].trim() });
    }

    return properties;
  }

  private validateCode(code: string): boolean {
    // Basic validation
    if (!code.startsWith('export default function App')) {
      this.detectedErrors.push({
        type: 'invalid_structure',
        line: 1,
        column: 1,
        message: 'Code must start with "export default function App"',
        snippet: code.substring(0, 50)
      });
      return false;
    }

    // Check balanced brackets
    const brackets = { '{': 0, '(': 0, '[': 0 };
    for (const char of code) {
      if (char === '{') brackets['{']++;
      if (char === '}') brackets['{']--;
      if (char === '(') brackets['(']++;
      if (char === ')') brackets['(']--;
      if (char === '[') brackets['[']++;
      if (char === ']') brackets['[']--;
    }

    for (const [bracket, count] of Object.entries(brackets)) {
      if (count !== 0) {
        this.detectedErrors.push({
          type: 'unbalanced_brackets',
          line: 0,
          column: 0,
          message: `Unbalanced ${bracket}: ${count > 0 ? 'missing closing' : 'extra closing'}`,
          snippet: ''
        });
        return false;
      }
    }

    return true;
  }

  private resetState(): void {
    this.fixStats.clear();
    this.detectedErrors = [];
    this.fixLog = [];
  }

  // ============ PUBLIC UTILITIES ============

  /**
   * Generate a detailed report of the fixes applied
   */
  public generateReport(): string {
    const report: string[] = ['=== Gemini Code Fix Report ===\n'];

    // Summary stats
    report.push('Fix Statistics:');
    this.fixStats.forEach((count, name) => {
      report.push(`  ${name}: ${count} fixes`);
    });

    // Detected errors
    if (this.detectedErrors.length > 0) {
      report.push('\nDetected Errors:');
      this.detectedErrors.forEach((error, idx) => {
        report.push(`  ${idx + 1}. Line ${error.line}: ${error.type}`);
        report.push(`     ${error.message}`);
      });
    }

    // Fix log
    if (this.fixLog.length > 0) {
      report.push('\nFix Log:');
      this.fixLog.forEach(log => report.push(`  ${log}`));
    }

    return report.join('\n');
  }

  /**
   * Run tests on all patterns
   */
  public testPatterns(): { pattern: string; success: boolean; input: string; output: string }[] {
    const results = [];

    for (const pattern of this.errorPatterns) {
      if (pattern.test) {
        const fixed = pattern.test.replace(pattern.pattern, pattern.fix);
        results.push({
          pattern: pattern.name,
          success: fixed !== pattern.test,
          input: pattern.test,
          output: fixed
        });
      }
    }

    return results;
  }
}

// Export singleton instance
export const codeFixer = new GeminiCodeFixer();
