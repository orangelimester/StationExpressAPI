const winston = require('winston')
const { addColors, createLogger, format, transports } = require('winston');
const fs = require('fs');
const moment = require('moment');
const { combine, colorize, printf, timestamp } = format;
dateFormat = () => {
  return new Date();
}

// Winston logger service class
class LoggerService {
  constructor(route) {
    /* Route allows for multiple logger files */
    this.route = route
    
    /* Creates logger based on above route */
    const logger = createLogger({
      format: combine(
       printf((info) => {
        let message = `${dateFormat()} | ${info.level.toUpperCase()} | ${route}.log | ${info.message} `
        message = info.obj ? message + `| data:${JSON.stringify(info.obj)} ` : message
        return message
      }),
      ),
      transports: [
        new transports.Console({
          format: format.combine(
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