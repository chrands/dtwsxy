import { config } from './config';

/**
 * 日志工具
 * 统一日志输出格式
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  debug(message: string, meta?: unknown) {
    if (config.logging.level === 'debug') {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  info(message: string, meta?: unknown) {
    if (['debug', 'info'].includes(config.logging.level)) {
      console.info(this.formatMessage('info', message, meta));
    }
  }

  warn(message: string, meta?: unknown) {
    if (['debug', 'info', 'warn'].includes(config.logging.level)) {
      console.warn(this.formatMessage('warn', message, meta));
    }
  }

  error(message: string, error?: unknown) {
    console.error(this.formatMessage('error', message, error));
  }
}

export const logger = new Logger();
