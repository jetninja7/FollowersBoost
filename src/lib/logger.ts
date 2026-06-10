import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',

  // Pretty print in development, JSON in production
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,

  formatters: {
    level: (label) => ({ level: label }),
  },

  // Redact sensitive fields
  redact: {
    paths: ['password', 'token', 'secret', 'authorization', 'cookie'],
    remove: true,
  },

  // Add service context
  base: {
    service: 'followersboost',
    env: process.env.NODE_ENV,
  },
});
