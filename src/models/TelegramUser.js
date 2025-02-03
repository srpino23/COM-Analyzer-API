import { Schema, model } from "mongoose";

const telegramUserSchema = new Schema(
  {
    chatId: {
      type: Number,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true, // Indica si el usuario debe recibir notificaciones
    },
    preferredHours: {
      start: {
        type: Number,
        default: 8, // Hora de inicio para enviar alertas (24 horas)
      },
      end: {
        type: Number,
        default: 24, // Hora de fin para enviar alertas (24 horas)
      },
    },
    lastAlertSent: {
      type: Date, // Registra la última vez que se envió una alerta al usuario
      default: null,
    },
    stabilizedAlertSent: { 
      type: Boolean, 
      default: false, // Indica si ya se envió la alerta de estabilización
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

export default model("TelegramUser", telegramUserSchema);