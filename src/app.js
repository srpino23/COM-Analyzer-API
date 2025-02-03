import express from "express";
import morgan from "morgan";
import cors from "cors";
import cron from "node-cron";

// Importar las rutas
import CameraRoutes from "./routes/camera.routes";
import ServerRoutes from "./routes/server.routes";
import ReportRoutes from "./routes/report.routes";
import UserRoutes from "./routes/user.routes";

// Funciones de tareas
import { checkCameras } from "./tasks/checkCameras";
import { checkServers } from "./tasks/checkServers";
import { makeDeviceReport } from "./tasks/makeDailyDeviceReport";
import { sendAlert } from "./tasks/sendAlert";

const app = express();

// Configuración
app.set("port", process.env.PORT || 2300);

// Middleware
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rutas
app.use("/api/camera", CameraRoutes);
app.use("/api/server", ServerRoutes);
app.use("/api/report", ReportRoutes);
app.use("/api/user", UserRoutes);

// Ejecutar las tareas directamente en el hilo principal
const cameraTask = () => {
  console.log("Iniciando tarea de cámaras...");
  checkCameras(); // Ejecutar la función directamente
};

const serverTask = () => {
  console.log("Iniciando tarea de servidores...");
  checkServers(); // Ejecutar la función directamente
};

const reportTask = () => {
  console.log("Iniciando tarea de reporte...");
  makeDeviceReport(); // Ejecutar la función directamente
};

const sendAlertTask = () => {
  console.log("Iniciando tarea de alerta...");
  sendAlert();
}

cameraTask();
serverTask();
sendAlertTask();

// Cron: Ejecutar tareas periódicamente
cron.schedule("0 8 * * *", reportTask); // Cada día a las 8:00 AM

export default app;
