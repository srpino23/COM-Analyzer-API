import "../database";  // Asegurarse de que la base de datos se conecte correctamente
import Camera from "../models/Camera";
import Server from "../models/Server";
import Report from "../models/Report";
import ExcelJS from "exceljs";
import path from "path";

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

// Función para guardar el reporte en la base de datos
const saveReportData = async (workbook) => {
  let date = new Date();
  let formattedDate = `${("0" + date.getDate()).slice(-2)}-${(
    "0" +
    (date.getMonth() + 1)
  ).slice(-2)}-${date.getFullYear()}`;

  const report = new Report({
    filename: formattedDate,
    url: path.join(__dirname, "..", "reports", `${formattedDate}.xlsx`),
  });

  await report.save();

  await workbook.xlsx.writeFile(
    path.join(__dirname, "..", "reports", `${formattedDate}.xlsx`)
  );

  console.log(
    "Reporte de dispositivos 'offline' generado con éxito en formato Excel."
  );
};

export const makeDeviceReport = async () => {
  try {
    // Filtrar las cámaras y servidores que están "offline"
    const cameras = await Camera.find({ status: "offline" });
    const servers = await Server.find({ status: "offline" });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Reporte diario");

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

    // Guardar el archivo Excel y guardar reporte en la base de datos
    saveReportData(workbook);
  } catch (error) {
    console.error(
      `Error al generar el reporte de dispositivos: ${error.message}`
    );
  }
};
