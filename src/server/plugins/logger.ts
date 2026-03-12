import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import * as path from 'path';

const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

const rootDir = process.cwd();

const myFormat = printf(options => {
  return `${options.timestamp} [${options.label}] ${options.level}: ${options.message}`;
});

const logger = createLogger({
  format: combine(label({ label: 'APPLICATION' }), timestamp(), myFormat),
  transports: [
    new DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.log',
      dirname: path.join(rootDir, 'logs'),
      utc: true,
      level: 'info'
    }),
    new DailyRotateFile({
      datePattern: 'YYYY-MM-DD',
      filename: '%DATE%.err.log',
      dirname: path.join(rootDir, 'logs'),
      utc: true,
      level: 'error'
    })
  ]
});

logger.add(
  new transports.Console({
    handleExceptions: true,
    format: format.combine(
      format.colorize({
        all: true
      })
    )
  })
);

export default logger;
