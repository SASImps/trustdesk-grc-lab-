type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: any;
}

export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(level: LogLevel, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context
    };
    this.logs.push(entry);
    console[level === 'debug' ? 'log' : level](`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`, context || '');
  }

  public info(message: string, context?: any) {
    this.log('info', message, context);
  }

  public warn(message: string, context?: any) {
    this.log('warn', message, context);
  }

  public error(message: string, context?: any) {
    this.log('error', message, context);
  }

  public debug(message: string, context?: any) {
    this.log('debug', message, context);
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }
}

export const logger = Logger.getInstance();
