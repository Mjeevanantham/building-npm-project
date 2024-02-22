const mongoose = require("mongoose");
const logger = require('../helper/logger');
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}`, {
      dbName: `${process.env.DB_NAME}`,
    });
    
    const db = mongoose.connection;
    console.log("DB is connnected....");
    db.on("error", (error) => {
      logger.info("appConstant.DBCONNECTION.ERROR", error);
    });
    db.on("reconnected", () => {
      logger.info("appConstant.DBCONNECTION.RECONNECTED");
    });
    db.on("disconnected", () => {
      logger.info("appConstant.DBCONNECTION.DISCONNECTED");
    });
    return db;
  } catch (error) {
    logger.info("appConstant.DBCONNECTION.ERROR", error);
    throw error;
  }
};

module.exports = connectDB;
