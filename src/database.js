import mongoose from "mongoose";
import config from "./config";

(async () => {
  try {
    // Configuración para evitar problemas de compatibilidad
    mongoose.set("strictQuery", false);

    // Conectar a MongoDB con opciones adicionales
    const db = await mongoose.connect(config.mongodbURL, {
      useNewUrlParser: true,        // Usa el nuevo parser de URL
      useUnifiedTopology: true,    // Manejo más eficiente de topología
      serverSelectionTimeoutMS: 5000, // Tiempo máximo para intentar conectarse al servidor
      socketTimeoutMS: 45000,        // Tiempo máximo de inactividad en los sockets
      maxPoolSize: 10,              // Límite del pool de conexiones
    });

    console.log("Database is connected to:", db.connection.name);

    // Eventos de conexión para monitorear el estado
    mongoose.connection.on("connected", () => {
      console.log("Mongoose conectado a MongoDB");
    });

    mongoose.connection.on("error", (err) => {
      console.error("Error en la conexión a MongoDB:", err.message);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("Mongoose desconectado de MongoDB");
    });
  } catch (error) {
    console.error("Error al conectar a la base de datos:", error.message);
    process.exit(1); // Finaliza la aplicación si no puede conectarse
  }
})();