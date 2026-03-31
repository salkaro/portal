type LogLevel = 'info' | 'warn' | 'error'

interface LogPayload {
  event: string
  userId?: string
  timestamp: string
  meta?: Record<string, unknown>
}

function log(level: LogLevel, event: string, meta?: Record<string, unknown>, userId?: string) {
  const payload: LogPayload = {
    event,
    userId,
    timestamp: new Date().toISOString(),
    meta,
  }

  // In production, ship to Axiom. In dev, write to console.
  if (process.env.NODE_ENV === 'production' && process.env.AXIOM_TOKEN && process.env.AXIOM_DATASET) {
    fetch(`https://api.axiom.co/v1/datasets/${process.env.AXIOM_DATASET}/ingest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AXIOM_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([payload]),
    }).catch(() => {
      // Fire-and-forget — never block the request path for logging
    })
  } else {
    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
    consoleFn(`[${level.toUpperCase()}] ${event}`, payload)
  }
}

export const logger = {
  info: (event: string, meta?: Record<string, unknown>, userId?: string) =>
    log('info', event, meta, userId),
  warn: (event: string, meta?: Record<string, unknown>, userId?: string) =>
    log('warn', event, meta, userId),
  error: (event: string, meta?: Record<string, unknown>, userId?: string) =>
    log('error', event, meta, userId),
}
