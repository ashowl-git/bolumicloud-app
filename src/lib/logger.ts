/**
 * Centralized logging utility
 *
 * Development: All logs output
 * Production: warn + error only
 * Test: error only
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogData {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: LogData
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const getMinLogLevel = (): number => {
  if (isTest) return LOG_LEVELS.error
  if (isDevelopment) return LOG_LEVELS.debug
  return LOG_LEVELS.warn
}

const minLogLevel = getMinLogLevel()

const formatLogEntry = (entry: LogEntry): string => {
  const parts = [`[${entry.timestamp}]`, `[${entry.level.toUpperCase()}]`, entry.message]
  if (entry.data) parts.push(JSON.stringify(entry.data))
  if (entry.error) parts.push(`Error: ${entry.error.name}: ${entry.error.message}`)
  return parts.join(' ')
}

const log = (level: LogLevel, message: string, dataOrError?: LogData | Error): void => {
  if (LOG_LEVELS[level] < minLogLevel) return

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (dataOrError instanceof Error) {
    entry.error = {
      name: dataOrError.name,
      message: dataOrError.message,
      stack: dataOrError.stack,
    }
  } else if (dataOrError) {
    entry.data = dataOrError
  }

  const formatted = formatLogEntry(entry)

  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(formatted)
      break
    case 'info':
      // eslint-disable-next-line no-console
      console.info(formatted)
      break
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(formatted)
      break
    case 'error':
      // eslint-disable-next-line no-console
      console.error(formatted)
      if (entry.error?.stack && isDevelopment) {
        // eslint-disable-next-line no-console
        console.error(entry.error.stack)
      }
      break
  }
}

export const logger = {
  debug: (message: string, data?: LogData): void => log('debug', message, data),
  info: (message: string, data?: LogData): void => log('info', message, data),
  warn: (message: string, data?: LogData): void => log('warn', message, data),
  error: (message: string, error?: Error | LogData): void => log('error', message, error),
}

export default logger
