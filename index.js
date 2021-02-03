/*
  Requires base project dependency 'winston-daily-rotate-file' (npm i winston-daily-rotate-file --save)
  Requires config.js present in base project directory with the following variables:

  exports.NODE_ENV = process.env.NODE_ENV || 'dev'; // if not 'production' console logging enabled
  exports.SERVICE_NAME = process.env.SERVICE_NAME || 'My Project Name';
  exports.TIMEZONE = process.env.TIMEZONE || 'America/Denver'; // https://momentjs.com/timezone/
  exports.LOG_LEVEL = process.env.LOG_LEVEL || 'debug'; // https://github.com/winstonjs/winston#logging-levels
*/
var config = require('../../config');
const winston = require('winston');
const moment = require('moment-timezone');
const { format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
require('winston-daily-rotate-file');

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

var transport = new (winston.transports.DailyRotateFile)({
  filename: `${config.SERVICE_NAME}-%DATE%.log`,
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

transport.on('rotate', function(oldFilename, newFilename) {
  logger.debug(`Rotating logs. Old: [${oldFilename}] New: [${newFilename}]`);
});

const appendTimestamp = format((info, opts) => {
  if(opts.tz)
    info.timestamp = moment().tz(opts.tz).format();
  return info;
});

const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    label({ label: config.SERVICE_NAME }),
    appendTimestamp({ tz: config.TIMEZONE }),
    myFormat
  ),
  //defaultMeta: { service: 'user-service' },
  transports: [
    transport
  ],
  exitOnError: false,
});

exports.newLogger = function() {
  /* Add console logging in non-prod */
  if (config.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple(),
    }));
  }
  return logger;
}