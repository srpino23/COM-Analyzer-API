import "../database"; // Asegurarse de que la base de datos se conecte correctamente
import ping from "ping";
import Server from "../models/Server";

// Función para verificar los servidores
export const checkServers = async () => {
  try {
    // Obtener solo los campos necesarios
    const servers = await Server.find({}, { mainIp: 1, status: 1 });

    const updates = []; // Arreglo para acumular las actualizaciones

    for (const server of servers) {
      const { mainIp } = server;

      try {
        const pingResult = await ping.promise.probe(mainIp, { timeout: 3 });

        const { alive, packetLoss, time } = pingResult;
        const packetLossNumber = parseFloat(packetLoss);
        const pingTime = parseFloat(time);

        let newStatus = "offline"; // Estado por defecto

        if (alive) {
          if (packetLossNumber === 0 && pingTime <= 100) {
            newStatus = "online"; // No hay pérdida de paquetes y latencia baja
          } else if (
            (packetLossNumber > 0 && packetLossNumber <= 90) || // Pérdida de paquetes moderada
            pingTime > 100 // Latencia alta
          ) {
            newStatus = "warning";
          }
        }

        // Agregar la actualización al arreglo solo si el estado cambia
        if (server.status !== newStatus) {
          updates.push({
            updateOne: {
              filter: { _id: server._id },
              update: { $set: { status: newStatus } },
            },
          });
        }
      } catch (pingError) {
        console.error(
          `Error al hacer ping al servidor ${mainIp}: ${pingError.message}`
        );
        if (server.status !== "offline") {
          updates.push({
            updateOne: {
              filter: { _id: server._id },
              update: { $set: { status: "offline" } },
            },
          });
        }
      }
    }

    // Realiza una operación de actualización masiva
    if (updates.length > 0) {
      await Server.bulkWrite(updates);
      console.log("Actualización masiva de servidores completada");
    } else {
      console.log("No hay cambios en los estados de los servidores");
    }

    // Llamar nuevamente a la función después de un pequeño delay
    setTimeout(checkServers, 5000); // Llamar nuevamente después de 5 segundos (ajusta el tiempo según necesites)
  } catch (error) {
    console.error(`Error en la verificación de servidores: ${error.message}`);
    setTimeout(checkServers, 5000); // Si ocurre un error, intentar nuevamente después de un tiempo
  }
};
