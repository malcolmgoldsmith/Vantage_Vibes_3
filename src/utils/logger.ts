/**
 * Production-ready logger utility
 * Automatically strips debug logs in production builds
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableDebug: boolean;
  prefix?: string;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true';
    this.config = {
      level: this.isDevelopment ? 'debug' : 'error',
      enableDebug: this.isDevelopment,
      prefix: '[VantageVibes]'
    };
  }

  /**
   * Debug-level logging (stripped in production)
   * Use for detailed debugging information
   */
  debug(message: string, ...args: any[]): void {
    if (this.config.enableDebug) {
      console.log(`${this.config.prefix} 🔍 [DEBUG]`, message, ...args);
    }
  }

  /**
   * Info-level logging
   * Use for general informational messages
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(`${this.config.prefix} ℹ️ [INFO]`, message, ...args);
    }
  }

  /**
   * Warning-level logging
   * Use for potentially problematic situations
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`${this.config.prefix} ⚠️ [WARN]`, message, ...args);
    }
  }

  /**
   * Error-level logging
   * Use for error conditions
   */
  error(message: string, error?: Error | unknown, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(`${this.config.prefix} ❌ [ERROR]`, message, ...args);

      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: this.isDevelopment ? error.stack : undefined
        });
      } else if (error) {
        console.error('Error details:', error);
      }
    }
  }

  /**
   * Success logging (always shows in development)
   */
  success(message: string, ...args: any[]): void {
    if (this.isDevelopment) {
      console.log(`${this.config.prefix} ✅ [SUCCESS]`, message, ...args);
    }
  }

  /**
   * Group logging for related messages
   */
  group(label: string, callback: () => void): void {
    if (this.isDevelopment) {
      console.group(`${this.config.prefix} ${label}`);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Table logging for structured data
   */
  table(data: any): void {
    if (this.isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Time tracking for performance measurement
   */
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(`${this.config.prefix} ${label}`);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(`${this.config.prefix} ${label}`);
    }
  }

  /**
   * API call logging
   */
  api(method: string, url: string, status?: number, duration?: number): void {
    if (this.isDevelopment) {
      const statusEmoji = status && status >= 200 && status < 300 ? '✅' : '❌';
      const durationText = duration ? `(${duration}ms)` : '';
      console.log(
        `${this.config.prefix} 🌐 [API]`,
        `${statusEmoji} ${method}`,
        url,
        status ? `[${status}]` : '',
        durationText
      );
    }
  }

  /**
   * Validation logging
   */
  validation(message: string, isValid: boolean, details?: any): void {
    if (this.isDevelopment) {
      const emoji = isValid ? '✅' : '❌';
      console.log(`${this.config.prefix} ${emoji} [VALIDATION]`, message, details || '');
    }
  }

  /**
   * Performance logging
   */
  perf(message: string, duration: number): void {
    if (this.isDevelopment) {
      const emoji = duration < 100 ? '⚡' : duration < 1000 ? '⏱️' : '🐌';
      console.log(`${this.config.prefix} ${emoji} [PERF]`, message, `${duration}ms`);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const configLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= configLevelIndex;
  }

  /**
   * Configure logger (useful for testing)
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for consumers
export type { LogLevel };
