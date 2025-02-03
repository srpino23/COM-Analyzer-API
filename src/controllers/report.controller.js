import Server from "../models/Server";
import Camera from "../models/Camera";
import Report from "../models/Report";
import csv from "csv-parser";
import ExcelJS from "exceljs";
import fs from "fs";
import path from "path";

export const getReports = async (req, res) => {
  try {
    const reports = await Report.find().sort({ _id: -1 });
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los reportes" });
  }
};

export const uploadCsv = async (req, res) => {
  try {
    const filePath = req.file.path; // Ruta temporal del archivo subido
    const cameras = []; // Arreglo para almacenar los datos procesados

    // Leer y procesar el archivo CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", async (row) => {
        try {
          // Buscar el servidor en la base de datos basado en el nombre del CSV
          const server = await Server.findOne({ name: row.Servidor });

          if (!server) {
            console.error(`Servidor ${row.Servidor} no encontrado`);
            return;
          }

          // Mapeo de los datos del CSV a los campos del modelo Camera
          const newCameraData = {
            name: row.Nombre,
            ip: row.IP,
            direction: row.Nombre, // Corregido para usar la columna correcta
            zone: row.Zona,
            latitude: parseFloat(row.Latitud), // Convertir a número
            longitude: parseFloat(row.Longitud), // Convertir a número
            type: row.Tipo,
            status: "online", // Asignado manualmente
            username: "default_user", // Valor predeterminado (opcional)
            password: "default_pass", // Valor predeterminado (opcional)
            serverId: server._id, // Usar el _id del servidor encontrado
          };

          // Crear una nueva cámara en la base de datos
          const newCamera = await Camera.create(newCameraData);

          // Agregar el ID de la cámara recién creada al array 'cameras' del servidor
          await Server.updateOne(
            { _id: server._id },
            { $push: { cameras: newCamera._id } }
          );

          // Agregar el ID de la cámara recién creada al arreglo de cámaras para la respuesta
          cameras.push(newCamera._id);
        } catch (dbError) {
          console.error("Error al procesar el servidor/cámara:", dbError);
        }
      })
      .on("end", async () => {
        try {
          // Eliminar el archivo después de procesarlo
          fs.unlinkSync(filePath);

          // Enviar respuesta con éxito
          res.status(201).json({
            message: "CSV subido correctamente",
            data: cameras, // Enviar los IDs de las cámaras creadas
          });
        } catch (fileError) {
          console.error("Error al eliminar el archivo:", fileError);
          res.status(500).json({ error: "Error al eliminar el archivo" });
        }
      });
  } catch (error) {
    console.error("Error al procesar el csv:", error);
    res.status(500).json({ error: "Error al procesar el csv" });
  }
};

export const downloadDailyReport = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el reporte de la base de datos
    const report = await Report.findById(id);

    if (!report) {
      return res.status(404).send("Reporte no encontrado");
    }

    const filePath = path.join(
      __dirname,
      "..",
      "reports",
      `${report.filename}.xlsx`
    );

    // Enviar el archivo para descarga
    res.download(filePath, (err) => {
      if (err) {
        console.error("Error al enviar el archivo:", err);
        res.status(500).send("Error al descargar el archivo");
      } else {
        console.log("Archivo enviado con éxito.");
      }
    });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).send("Error al procesar la solicitud");
  }
};

// Función para generar y enviar el reporte completo
export const generateFullReport = async (req, res) => {
  // Función para aplicar estilos y bordes a las celdas
  const applyStyles = (row, fillColor = "2c2c2c", textColor = "FFFFFF") => {
    row.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: fillColor },
      };
      cell.font = { color: { argb: textColor } };
      cell.border = {
        top: { style: "thin", color: { argb: "434343" } },
        left: { style: "thin", color: { argb: "434343" } },
        bottom: { style: "thin", color: { argb: "434343" } },
        right: { style: "thin", color: { argb: "434343" } },
      };
    });
  };

  // Función para añadir encabezados con estilos y bordes
  const addHeaders = (worksheet, headers, startRow, headerColor = "00FF7F") => {
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: headerColor } };
    headers.forEach((_, colIndex) => {
      const cell = headerRow.getCell(colIndex + 1);
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "0d0d0d" },
        bgColor: { argb: "0d0d0d" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "434343" } },
        left: { style: "thin", color: { argb: "434343" } },
        bottom: { style: "thin", color: { argb: "434343" } },
        right: { style: "thin", color: { argb: "434343" } },
      };
    });
    return headerRow;
  };

  // Función para añadir datos de dispositivos
  const addDeviceData = (worksheet, devices, deviceType) => {
    devices.forEach((device, index) => {
      const row = worksheet.addRow(
        deviceType === "server"
          ? [
              index + 1, // Número de servidor
              device.name,
              device.status,
              device.mainIp,
              device.ipsRange,
              device.zone,
            ]
          : [
              index + 1, // Número de cámara
              device.name,
              device.status,
              device.ip,
              device.type,
              device.zone,
              device.direction,
            ]
      );
      applyStyles(row);
    });
  };

  try {
    const cameras = await Camera.find();
    const servers = await Server.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte completo");

    // Añadir encabezados y datos para servidores
    const serverHeaders = [
      "Servidor",
      "Nombre",
      "Estado",
      "IP",
      "Rango de IPs",
      "Zona",
    ];
    addHeaders(worksheet, serverHeaders, 1);
    addDeviceData(worksheet, servers, "server");

    // Ajustar ancho de columnas para servidores
    [10, 30, 15, 30, 30, 30].forEach(
      (width, i) => (worksheet.getColumn(i + 1).width = width)
    );

    // Añadir espacio y encabezados para cámaras
    worksheet.addRow([]);
    const cameraHeaders = [
      "Camara",
      "Nombre",
      "Estado",
      "IP",
      "Tipo de camara",
      "Zona",
      "Direccion",
    ];
    addHeaders(worksheet, cameraHeaders, worksheet.lastRow.number);
    addDeviceData(worksheet, cameras, "camera");

    // Ajustar ancho de columnas para cámaras
    [10, 30, 15, 30, 30, 30, 30].forEach(
      (width, i) => (worksheet.getColumn(i + 1).width = width)
    );

    let date = new Date();
    let formattedDate = `${("0" + date.getDate()).slice(-2)}-${(
      "0" +
      (date.getMonth() + 1)
    ).slice(-2)}-${date.getFullYear()}`;

    // Configurar el nombre del archivo de descarga
    const filename = `reporte-completo-${formattedDate}.xlsx`;

    // Enviar el archivo en memoria para descarga
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    await workbook.xlsx.write(res);
    res.end();
    console.log("Reporte de dispositivos enviado para descarga con éxito.");
  } catch (error) {
    console.error(`Error al generar el reporte: ${error.message}`);
    res.status(500).send("Error al procesar la solicitud");
  }
};
