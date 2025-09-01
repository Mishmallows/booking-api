/**
 * Simple logging utility
 */
class Logger {
    constructor() {
        this.logLevel = process.env.LOG_LEVEL || 'info';
        this.levels = {
            debug: 0,
            info: 1,
            warn: 2,
            error: 3
        };
    }

    shouldLog(level) {
        return this.levels[level] >= this.levels[this.logLevel];
    }

    formatMessage(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const baseLog = {
            timestamp,
            level: level.toUpperCase(),
            message
        };

        if (data) {
            baseLog.data = data;
        }

        return JSON.stringify(baseLog);
    }

    debug(message, data = null) {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, data));
        }
    }

    info(message, data = null) {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, data));
        }
    }

    warn(message, data = null) {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message, data = null) {
        if (this.shouldLog('error')) {
            console.error(this.formatMessage('error', message, data));
        }
    }
}

module.exports = new Logger();
