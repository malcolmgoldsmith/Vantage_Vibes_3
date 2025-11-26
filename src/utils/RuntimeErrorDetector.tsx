// RuntimeErrorDetector.ts - Catches and diagnoses runtime errors in generated React components

import React from 'react';

interface RuntimeError {
  message: string;
  stack?: string;
  component: string;
  line?: number;
  column?: number;
  type: 'SyntaxError' | 'ReferenceError' | 'TypeError' | 'RenderError' | 'HookError';
  possibleCause?: string;
  suggestedFix?: string;
}

export class RuntimeErrorDetector {
  private errorPatterns = [
    {
      // Template literal errors
      pattern: /Unexpected token.*\$|Unexpected token.*\{/,
      type: 'SyntaxError',
      cause: 'Missing backticks in template literal',
      fix: 'Wrap the entire string containing ${} in backticks'
    },
    {
      // Missing variable
      pattern: /(\w+) is not defined/,
      type: 'ReferenceError',
      cause: 'Variable used before declaration',
      fix: 'Check variable name spelling or ensure it\'s declared with const/let'
    },
    {
      // React Hook errors
      pattern: /Invalid hook call|Hooks can only be called/,
      type: 'HookError',
      cause: 'Hook called conditionally or outside component',
      fix: 'Move hook to top level of component, not inside conditions or loops'
    },
    {
      // Missing React prefix
      pattern: /useState is not defined|useEffect is not defined/,
      type: 'ReferenceError',
      cause: 'Hook called without React prefix',
      fix: 'Change useState to React.useState'
    },
    {
      // Math operator errors
      pattern: /Unexpected number|Invalid left-hand side in assignment/,
      type: 'SyntaxError',
      cause: 'Missing mathematical operator',
      fix: 'Add *, +, -, or / between values'
    },
    {
      // JSX errors
      pattern: /Expected corresponding JSX closing tag|Unterminated JSX contents/,
      type: 'SyntaxError',
      cause: 'Mismatched or missing JSX tags',
      fix: 'Ensure all opened tags are properly closed'
    },
    {
      // Object/Array errors
      pattern: /Cannot read properties of undefined|Cannot read property .* of undefined/,
      type: 'TypeError',
      cause: 'Accessing property of undefined value',
      fix: 'Add null checks or optional chaining (?.) operator'
    }
  ];

  /**
   * Analyzes an error and provides diagnostic information
   */
  public diagnoseError(error: Error, code: string): RuntimeError {
    const diagnosis: RuntimeError = {
      message: error.message,
      stack: error.stack,
      component: 'App',
      type: 'RenderError'
    };

    // Try to extract line/column from error
    const lineMatch = error.stack?.match(/:(\d+):(\d+)/);
    if (lineMatch) {
      diagnosis.line = parseInt(lineMatch[1]);
      diagnosis.column = parseInt(lineMatch[2]);
    }

    // Match against known patterns
    for (const pattern of this.errorPatterns) {
      if (pattern.pattern.test(error.message)) {
        diagnosis.type = pattern.type as any;
        diagnosis.possibleCause = pattern.cause;
        diagnosis.suggestedFix = pattern.fix;
        break;
      }
    }

    // Additional specific diagnostics
    if (error.message.includes('Unexpected token')) {
      diagnosis.suggestedFix = this.getSyntaxErrorFix(error.message, code);
    }

    return diagnosis;
  }

  /**
   * Provides specific fix suggestions for syntax errors
   */
  private getSyntaxErrorFix(errorMessage: string, code: string): string {
    if (errorMessage.includes('${')) {
      return 'Add backticks around the entire string containing ${}. Example: `text ${variable}`';
    }

    if (errorMessage.includes('Unexpected token )')) {
      return 'Check for missing multiplication operator before parenthesis. Example: value * (a + b)';
    }

    if (errorMessage.includes('%')) {
      return 'Ensure % is inside the template literal. Correct: `${value}%` Wrong: `${value}`%';
    }

    if (errorMessage.includes('px') || errorMessage.includes('rem')) {
      return 'Ensure units are inside the template literal. Correct: `${value}px` Wrong: `${value}`px';
    }

    return 'Check for missing operators, unbalanced brackets, or incorrect template literal syntax';
  }

  /**
   * Attempts to auto-fix common runtime errors
   */
  public attemptAutoFix(error: RuntimeError, code: string): string | null {
    let fixedCode = code;

    // Based on the error type, apply specific fixes
    switch (error.type) {
      case 'SyntaxError':
        if (error.possibleCause?.includes('template literal')) {
          // Find the error line and fix template literals
          const lines = code.split('\n');
          if (error.line && error.line <= lines.length) {
            const line = lines[error.line - 1];
            const fixedLine = this.fixLineTemplateLiterals(line);
            if (fixedLine !== line) {
              lines[error.line - 1] = fixedLine;
              return lines.join('\n');
            }
          }
        }
        break;

      case 'ReferenceError':
        if (error.message.includes('is not defined')) {
          const varName = error.message.match(/(\w+) is not defined/)?.[1];
          if (varName && ['useState', 'useEffect', 'useCallback', 'useMemo'].includes(varName)) {
            // Add React prefix
            fixedCode = fixedCode.replace(new RegExp(`\\b${varName}\\b`, 'g'), `React.${varName}`);
            return fixedCode;
          }
        }
        break;
    }

    return null;
  }

  /**
   * Fix template literals in a single line
   */
  private fixLineTemplateLiterals(line: string): string {
    // Fix className without backticks
    if (line.includes('className=') && line.includes('${')) {
      line = line.replace(/className=\{([^`][^}]+)\}/g, (match, content) => {
        if (content.includes('${')) {
          return `className={\`${content}\`}`;
        }
        return match;
      });
    }

    // Fix style properties
    if (line.includes('style=') && line.includes('${')) {
      line = line.replace(/:\s*([^`][^,}]*\$\{[^}]+\}[^,}]*)/g, (match, value) => {
        return `: \`${value.trim()}\``;
      });
    }

    // Fix JSX text content
    if (line.includes('>${') && !line.includes('{`')) {
      line = line.replace(/>([^<]*\$\{[^}]+\}[^<]*)</g, '>{\`$1\`}<');
    }

    return line;
  }

  /**
   * Create a detailed error report
   */
  public generateErrorReport(error: RuntimeError, code: string): string {
    const lines = code.split('\n');
    const report: string[] = [];

    report.push('=== RUNTIME ERROR DETECTED ===\n');
    report.push(`Error Type: ${error.type}`);
    report.push(`Message: ${error.message}`);

    if (error.line && error.column) {
      report.push(`Location: Line ${error.line}, Column ${error.column}`);

      // Show code context
      const start = Math.max(0, error.line - 3);
      const end = Math.min(lines.length, error.line + 2);

      report.push('\nCode Context:');
      for (let i = start; i < end; i++) {
        const marker = i === error.line - 1 ? '>>> ' : '    ';
        report.push(`${marker}${i + 1}: ${lines[i]}`);
      }
    }

    if (error.possibleCause) {
      report.push(`\nPossible Cause: ${error.possibleCause}`);
    }

    if (error.suggestedFix) {
      report.push(`Suggested Fix: ${error.suggestedFix}`);
    }

    return report.join('\n');
  }
}

// Create singleton instance
export const runtimeErrorDetector = new RuntimeErrorDetector();

/**
 * Error Boundary Component for catching React errors
 */
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: (error: RuntimeError) => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Diagnose the error
    const diagnosis = runtimeErrorDetector.diagnoseError(error, '');
    this.props.onError(diagnosis);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-800 font-bold">Component Error</h3>
          <pre className="text-xs mt-2 text-red-600">
            {this.state.error?.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Export types for use in other files
export type { RuntimeError };
