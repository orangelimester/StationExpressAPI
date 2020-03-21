const winston = require('winston')
const { addColors, createLogger, format, transports } = require('winston');
const fs = require('fs');
const { combine, colorize, printf, timestamp } = format;
dateFormat = () => {
  return new Date(Date.now()).toUTCString()
}
class LoggerService {
  constructor(route) {
    this.route = route
    const logger = createLogger({
      format: combine(
        format.timestamp(),
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }), printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route}.log | ${info.message} `
        message = info.obj ? message + `| data:${JSON.stringify(info.obj)} ` : message
        return message
      }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(
            format.timestamp(),
            format.colorize(),
            format.printf((info) => {
              let message = `${dateFormat()} | ${info.level} | ${route}.log | ${info.message} `
              message = info.obj ? message + `| data:${JSON.stringify(info.obj)} ` : message
              return message
            }),
          )
        }),
        new winston.transports.File({
          filename: `./logs/${route}.log`
        })
      ]
   });
   this.logger = logger
}
async info(message) {
  this.logger.log('info', message);
}
async info(message, obj) {
  this.logger.log('info', message, {
    obj
  })
}
async debug(message) {
  this.logger.log('debug', message);
}
async debug(message, obj) {
  this.logger.log('debug', message, {
    obj
  })
}
async error(message) {
  this.logger.log('error', message);
}
async error(message, obj) {
  this.logger.log('error', message, {
    obj
  })
}
}
module.exports = LoggerService