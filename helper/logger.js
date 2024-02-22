const { createLogger, transports, format } = require("winston");

/**
 * Format the log messages with timestamp
 */
const customFormat = format.combine(
  format.timestamp(),
  format.printf((info) => {
    return `${info.timestamp} - [${info.level.toUpperCase().padEnd(5)}] - ${
      info.message
    }`;
  })
);

/**
 * Controll log message
 */
const logger = createLogger({
  format: customFormat,
  transports: [
    new transports.Console({
      level: "info",
    }),
    new transports.File({
      filename: "users-service.log",
      level: "info",
    }),
  ],
});

module.exports = logger;
