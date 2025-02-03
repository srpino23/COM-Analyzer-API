import "../database";
import ping from "ping";
import pLimit from "p-limit";
import Camera from "../models/Camera";

const limit = pLimit(10);

export const checkCameras = async () => {
  try {
    const cameras = await Camera.find({}, { ip: 1, status: 1, zone: 1 });

    const zones = [
      ...new Set(cameras.map((camera) => camera.zone.toLowerCase())),
    ];

    const determineStatus = (alive, packetLoss, time) => {
      if (alive && packetLoss === 0 && time <= 100) return "online";
      if (alive && (packetLoss > 0 || time > 100)) return "warning";
      return "offline";
    };

    const checkZoneCameras = async (zone) => {
      const zoneCameras = cameras.filter(
        (camera) => camera.zone.toLowerCase() === zone
      );

      const pingPromises = zoneCameras.map((camera) =>
        limit(async () => {
          if (camera.status === "maintenance") return null;

          try {
            const pingResult = await ping.promise.probe(camera.ip, {
              timeout: 3,
            });
            const newStatus = determineStatus(
              pingResult.alive,
              parseFloat(pingResult.packetLoss),
              parseFloat(pingResult.time)
            );

            if (camera.status !== newStatus) {
              return {
                updateOne: {
                  filter: { _id: camera._id },
                  update: { $set: { status: newStatus } },
                },
              };
            }
          } catch {
            if (camera.status !== "offline") {
              return {
                updateOne: {
                  filter: { _id: camera._id },
                  update: { $set: { status: "offline" } },
                },
              };
            }
          }
          return null;
        })
      );

      const updates = (await Promise.all(pingPromises)).filter(Boolean);

      if (updates.length > 0) {
        await Camera.bulkWrite(updates);
        console.log(`Actualización masiva completada para la zona: ${zone}`);
      }
    };

    await Promise.all(zones.map((zone) => checkZoneCameras(zone)));
    setTimeout(checkCameras, 5000);
  } catch (error) {
    console.error(`Error en la verificación de cámaras: ${error.message}`);
    setTimeout(checkCameras, 5000);
  }
};
