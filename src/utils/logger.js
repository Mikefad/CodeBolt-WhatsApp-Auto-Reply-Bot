const LEVELS = ['error', 'warn', 'info', 'debug'];

class Logger {
  constructor(level = 'info') {
    this.level = level;
  }

  shouldLog(targetLevel) {
    return LEVELS.indexOf(targetLevel) <= LEVELS.indexOf(this.level);
  }

  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) {
      return;
    }

    const payload = {
      level,
      timestamp: new Date().toISOString(),
      ...meta,
    };

    const formatted = `[${payload.timestamp}] [${level.toUpperCase()}] ${message}`;

    if (level === 'error') {
      console.error(formatted, meta.error || '');
    } else if (level === 'warn') {
      console.warn(formatted);
    } else {
      console.log(formatted, Object.keys(meta).length ? meta : '');
    }
  }

  error(message, meta) {
    this.log('error', message, meta);
  }

  warn(message, meta) {
    this.log('warn', message, meta);
  }

  info(message, meta) {
    this.log('info', message, meta);
  }

  debug(message, meta) {
    this.log('debug', message, meta);
  }
}

module.exports = Logger;
