import { config } from "dotenv";
config();

export default {
  mongodbURL: process.env.MONGODB_URI,
  telegramToken: process.env.TELEGRAM_TOKEN,
};