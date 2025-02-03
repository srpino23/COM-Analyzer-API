const TelegramBot = require("node-telegram-bot-api");
import config from "../config";
import "../database";
import Camera from "../models/Camera";
import TelegramUser from "../models/TelegramUser";

const token = config.telegramToken;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  // Busca o crea un nuevo usuario en la base de datos
  const user = await TelegramUser.findOneAndUpdate(
    { chatId },
    { chatId, isActive: true }, // Actualiza si existe
    { upsert: true, new: true } // Crea si no existe
  );

  console.log(`Usuario registrado o actualizado: ${chatId}`);

  bot.sendMessage(
    chatId,
    "¡Bienvenido al bot! Te notificaré si hay problemas con las cámaras."
  );
});

bot.onText(/\/reporte/, async (msg) => {
  const chatId = msg.chat.id;

  try {
    // Buscar el usuario en la base de datos
    const user = await TelegramUser.findOne({ chatId });
    if (!user) {
      bot.sendMessage(chatId, "No estás registrado para recibir reportes.");
      return;
    }

    // Obtener el estado de las cámaras, excluyendo las de la zona 'com' y sin contar las de maintenance y warning
    const totalCameras = await Camera.countDocuments({
      $and: [{ zone: { $ne: "com" } }, { $nor: [{ status: "maintenance" }] }],
    });
    const onlineCameras = await Camera.countDocuments({
      $and: [
        { zone: { $ne: "com" } },
        { $nor: [{ status: "maintenance" }, { status: "warning" }] },
        { status: "online" },
      ],
    });
    const offlineCameras = await Camera.countDocuments({
      $and: [
        { zone: { $ne: "com" } },
        { $nor: [{ status: "maintenance" }, { status: "warning" }] },
        { status: "offline" },
      ],
    });
    const offlinePercentage = (offlineCameras / totalCameras) * 100;
    // Calcular tiempo restante para la próxima alerta automática
    const now = Date.now();
    const lastAlert = user.lastAlertSent
      ? new Date(user.lastAlertSent).getTime()
      : 0;
    const nextAlertTime = Math.max(0, 3600000 - (now - lastAlert));
    const minutesUntilNextAlert = Math.ceil(nextAlertTime / 60000);

    const reportMessage = `
📊 *REPORTE RÁPIDO* 📊

*Estado actual de las cámaras:*
- Total de cámaras: *${totalCameras}*
- Cámaras online: *${onlineCameras}*
- Cámaras offline: *${offlineCameras}*

*Porcentaje de cámaras offline:*
- *${offlinePercentage.toFixed(2)}%*

⏳ Próxima alerta automática en aproximadamente: *${minutesUntilNextAlert} minutos*
    `.trim();

    bot.sendMessage(chatId, reportMessage, { parse_mode: "Markdown" });
  } catch (error) {
    console.error(`Error al generar el reporte rápido: ${error.message}`);
    bot.sendMessage(
      chatId,
      "Ocurrió un error al generar el reporte rápido. Por favor, intenta más tarde."
    );
  }
});

bot.onText(/\/horario (\d{1,2})\/(\d{1,2})/, async (msg, match) => {
  const chatId = msg.chat.id;
  const start = parseInt(match[1], 10);
  const end = parseInt(match[2], 10);

  // Verificar que las horas sean válidas
  if (start >= 0 && start < 24 && end >= 0 && end <= 24 && start < end) {
    try {
      // Buscar al usuario en la base de datos
      const user = await TelegramUser.findOne({ chatId });
      if (!user) {
        bot.sendMessage(
          chatId,
          "No estás registrado para recibir notificaciones."
        );
        return;
      }

      // Actualizar las horas preferidas del usuario
      user.preferredHours.start = start;
      user.preferredHours.end = end;

      await user.save();

      bot.sendMessage(
        chatId,
        `¡Horario de alertas actualizado! Ahora recibirás alertas entre las ${start}:00 y las ${end}:00.`
      );
    } catch (error) {
      console.error(`Error al actualizar el horario: ${error.message}`);
      bot.sendMessage(chatId, "Ocurrió un error al actualizar el horario.");
    }
  } else {
    bot.sendMessage(
      chatId,
      "Por favor, ingresa un horario válido en formato /horario comienzo/fin (por ejemplo, /horario 8/18)."
    );
  }
});

bot.onText(/\/msg (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const messageText = match[1];

  try {
    // Recupera todos los usuarios activos de la base de datos
    const users = await TelegramUser.find({ isActive: true });

    users.forEach(async (user) => {
      bot.sendMessage(user.chatId, messageText);
    });

    bot.sendMessage(chatId, "Mensaje enviado a todos los usuarios activos.");
  } catch (error) {
    console.error(`Error al enviar el mensaje: ${error.message}`);
    bot.sendMessage(chatId, "Ocurrió un error al enviar el mensaje.");
  }
});

console.log("Bot está funcionando...");

// Función para verificar el estado de las cámaras
export const sendAlert = async () => {
  try {
    // Obtener el estado de las cámaras, excluyendo las de la zona 'com' y sin contar las de maintenance y warning
    const totalCameras = await Camera.countDocuments({
      $and: [{ zone: { $ne: "com" } }, { $nor: [{ status: "maintenance" }] }],
    });
    const onlineCameras = await Camera.countDocuments({
      $and: [
        { zone: { $ne: "com" } },
        { $nor: [{ status: "maintenance" }, { status: "warning" }] },
        { status: "online" },
      ],
    });
    const offlineCameras = await Camera.countDocuments({
      $and: [
        { zone: { $ne: "com" } },
        { $nor: [{ status: "maintenance" }, { status: "warning" }] },
        { status: "offline" },
      ],
    });
    const offlinePercentage = (offlineCameras / totalCameras) * 100;

    console.log(
      `Total: ${totalCameras}, Online: ${onlineCameras}, Offline: ${offlineCameras}, Porcentaje Offline: ${offlinePercentage.toFixed(
        2
      )}%`
    );

    if (offlinePercentage > 8) {
      const alertMessage = `
⚠️ *ALERTA DE SISTEMA* ⚠️

*Estado de las cámaras:*
- Total de cámaras: *${totalCameras}*
- Cámaras online: *${onlineCameras}*
- Cámaras offline: *${offlineCameras}*

*Porcentaje de cámaras offline:*
- *${offlinePercentage.toFixed(2)}%*

🚨 *Por favor, verifica el sistema de cámaras lo antes posible.* 🚨
      `.trim();

      // Recupera todos los usuarios activos de la base de datos
      const users = await TelegramUser.find({ isActive: true });

      users.forEach(async (user) => {
        const now = new Date();
        const currentHour = now.getHours(); // Hora actual en formato 24 horas
        const lastAlert = user.lastAlertSent
          ? new Date(user.lastAlertSent).getTime()
          : 0;

        // Verifica si la hora actual está dentro del rango de horas preferidas del usuario
        if (
          currentHour >= user.preferredHours.start &&
          currentHour < user.preferredHours.end
        ) {
          // Envía la alerta si ha pasado más de 1 hora desde la última
          if (now - lastAlert >= 3600000) {
            bot.sendMessage(user.chatId, alertMessage, {
              parse_mode: "Markdown",
            });

            // Actualiza la última hora de alerta en la base de datos
            await TelegramUser.findByIdAndUpdate(user._id, {
              lastAlertSent: now,
            });
          } else {
            console.log(
              `Ya se envió una alerta reciente al chat ${user.chatId}. Esperando una hora antes de enviar otra.`
            );
          }
        } else {
          console.log(
            `El usuario ${user.chatId} está fuera de su horario preferido.`
          );
        }
      });
    } else if (offlinePercentage < 8) {
      // Enviar alerta de estabilización solo una vez
      const stabilizedMessage = `
✅ *SISTEMA ESTABILIZADO* ✅

*Estado de las cámaras:*
- Total de cámaras: *${totalCameras}*
- Cámaras online: *${onlineCameras}*
- Cámaras offline: *${offlineCameras}*

*Porcentaje de cámaras offline:*
- *${offlinePercentage.toFixed(2)}%*

El sistema se ha estabilizado, y todo está funcionando correctamente.
      `.trim();

      const users = await TelegramUser.find({
        isActive: true,
        stabilizedAlertSent: false, // Solo enviar a los usuarios que no han recibido la alerta
      });

      users.forEach(async (user) => {
        const currentHour = new Date().getHours();

        // Verifica si la hora actual está dentro del horario preferido del usuario
        if (
          currentHour >= user.preferredHours.start &&
          currentHour < user.preferredHours.end
        ) {
          bot.sendMessage(user.chatId, stabilizedMessage, {
            parse_mode: "Markdown",
          });

          await TelegramUser.findByIdAndUpdate(user._id, {
            stabilizedAlertSent: true,
          });
        }
      });
    }

    // Restablecer la alerta de estabilización si las cámaras vuelven a estar fuera de línea en un porcentaje alto
    if (offlinePercentage > 8) {
      await TelegramUser.updateMany(
        { isActive: true },
        { stabilizedAlertSent: false }
      );
    }

    setTimeout(sendAlert, 5000); // Verifica cada 5 segundos
  } catch (error) {
    console.error(`Error en el envío de la alerta: ${error.message}`);
    setTimeout(sendAlert, 5000);
  }
};
