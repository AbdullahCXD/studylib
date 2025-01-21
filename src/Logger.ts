/**
 * @fileoverview Logger utility for consistent logging across the application
 * @module Logger
 */

import clc from "cli-color";
import path from "path";

/** Available log levels */
type LogLevel = 'info' | 'debug' | 'warn' | 'error';

/** Logger configuration options */
interface LoggerSettings {
  /** Enable debug logging */
  debug?: boolean;
  /** Show timestamps in logs */
  timestamps?: boolean;
  /** Enable colored output */
  colors?: boolean;
  /** Minimum log level to display */
  logLevel?: LogLevel;
}

interface StackFrame {
  file: string;
  line: number;
  column: number;
  function: string;
}

/**
 * Logger class providing consistent logging functionality
 * Implements singleton pattern for global access
 */
export class Logger {
  private static instance: Logger;
  readonly #settings: Required<LoggerSettings>;

  /**
   * Creates a new Logger instance
   * @param settings Logger configuration options
   */
  constructor(settings: LoggerSettings = {}) {
    this.#settings = {
      debug: settings.debug ?? false,
      timestamps: settings.timestamps ?? true,
      colors: settings.colors ?? true,
      logLevel: settings.logLevel ?? 'info'
    };
  }

  /**
   * Gets the singleton Logger instance
   * @param settings Optional settings to configure the logger
   * @returns Logger instance
   */
  static getInstance(settings?: LoggerSettings): Logger {
    return Logger.instance ??= new Logger(settings);
  }

  /**
   * Gets the current timestamp string
   * @returns Formatted timestamp or empty string if timestamps disabled
   */
  #getTimestamp = (): string => {
    if (!this.#settings.timestamps) return '';
    return clc.blackBright(`[${new Date().toLocaleTimeString()}]`);
  };

  #parseStackTrace = (error: Error): StackFrame[] => {
    const stack = error.stack?.split('\n').slice(1) || [];
    return stack.map(_line => {
      const match = _line.match(/^\s*at (?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/);
      if (!match) return null;

      const [_, fnName, file, line, col] = match;
      return {
        function: fnName || '<anonymous>',
        file: file ? path.relative(process.cwd(), file) : '<unknown>',
        line: parseInt(line || '0', 10),
        column: parseInt(col || '0', 10)
      };
    }).filter((frame): frame is StackFrame => frame !== null);
  };

  #formatStackTrace = (frames: StackFrame[]): string => {
    return frames.map((frame, i) => {
      const prefix = i === 0 ? '→' : ' ';
      const fileInfo = clc.cyan(`${frame.file}:${frame.line}:${frame.column}`);
      const fnName = clc.yellow(frame.function);
      return `   ${prefix} ${fnName}\n      ${fileInfo}`;
    }).join('\n');
  };

  /**
   * Formats and outputs a log message
   * @param level Log level indicator
   * @param message Message to log
   * @param color Color function to apply
   */
  #formatMessage = (level: string, message: string, color: (msg: string) => string, error?: Error): void => {
    const timestamp = this.#getTimestamp();
    
    if (!this.#settings.colors) {
      console.log(`${timestamp} [${level}] ${message}`);
      if (error?.stack) console.log(error.stack);
      return;
    }

    const levelIndicator = color(`⚡ ${level.toUpperCase()} ⚡`);
    const separator = color('•');
    const formattedMessage = message
      .split('\n')
      .map(line => color(line))
      .join('\n');

    console.log(`${timestamp} ${levelIndicator} ${separator} ${formattedMessage}`);
    
    if (error) {
      const frames = this.#parseStackTrace(error);
      console.log('\n' + this.#formatStackTrace(frames) + '\n');
    }
  };

  /**
   * Checks if a log level should be displayed
   * @param targetLevel Level to check
   * @returns Whether the level should be logged
   */
  #shouldLog = (targetLevel: LogLevel): boolean => {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentIdx = levels.indexOf(this.#settings.logLevel);
    const targetIdx = levels.indexOf(targetLevel);
    return targetIdx >= currentIdx;
  };

  /**
   * Logs an informational message
   * @param message Message to log
   */
  info = (message: string): void => {
    if (!this.#shouldLog('info')) return;
    this.#formatMessage('info', message, clc.blue);
  };

  /**
   * Logs a success message
   * @param message Message to log
   */
  success = (message: string): void => {
    if (!this.#shouldLog('info')) return;
    this.#formatMessage('success', message, clc.green);
  };

  /**
   * Logs a warning message
   * @param message Message to log
   */
  warning = (message: string, error?: Error): void => {
    if (!this.#shouldLog('warn')) return;
    this.#formatMessage('warn', message, clc.yellow, error);
  };

  /**
   * Logs an error message
   * @param message Message to log
   */
  error = (message: string, error?: Error): void => {
    if (!this.#shouldLog('error')) return;
    this.#formatMessage('error', message, clc.red, error);
  };

  /**
   * Logs a debug message
   * Only shown if debug mode is enabled
   * @param message Message to log
   */
  debug = (message: string, error?: Error): void => {
    if (!this.#settings.debug || !this.#shouldLog('debug')) return;
    this.#formatMessage('debug', message, clc.magenta, error);
  };
}
