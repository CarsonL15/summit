type LogLevel = 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  [key: string]: unknown
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  }
}

/**
 * Structured logger for server-side use.
 * Outputs JSON to stdout/stderr for Vercel Log Drain compatibility.
 *
 * Usage:
 *   logger.info('User created', { userId: '...', role: 'firefighter' })
 *   logger.error('Failed to send email', { error: err.message, email: '...' })
 */
export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    const entry = formatLog('info', message, meta)
    console.log(JSON.stringify(entry))
  },

  warn(message: string, meta?: Record<string, unknown>) {
    const entry = formatLog('warn', message, meta)
    console.warn(JSON.stringify(entry))
  },

  error(message: string, meta?: Record<string, unknown>) {
    const entry = formatLog('error', message, meta)
    console.error(JSON.stringify(entry))
  },
}
