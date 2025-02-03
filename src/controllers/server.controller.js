import Server from "../models/Server";
import Camera from "../models/Camera";

export const addServer = async (req, res) => {
  try {
    const { name, zone, mainIp, ipsRange, username, password, } = req.body;

    let message, data;

    const server = new Server({
      name,
      zone,
      mainIp,
      ipsRange,
      status: "online",
      username,
      password,
      cameras: [],
    });

    await server.save();

    message = "Servidor agregado correctamente";
    data = server;

    res.status(201).json({ message, data });
  } catch (error) {
    console.error("Error al agregar el servidor:", error);
    res.status(500).json({ error: "Error al agregar el servidor" });
  }
};

export const getServers = async (req, res) => {
  try {
    const servers = await Server.find();

    res.status(200).json(servers);
  } catch (error) {
    console.error("Error al obtener los servidores:", error);
    res.status(500).json({ error: "Error al obtener los servidores" });
  }
};

export const getServer = async (req, res) => {
  try {
    const { id } = req.params;

    const server = await Server.findById(id);

    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    res.status(200).json(server);
  } catch (error) {
    console.error("Error al obtener el servidor:", error);
    res.status(500).json({ error: "Error al obtener el servidor" });
  }
};

export const getServerCameras = async (req, res) => {
  try {
    const { id } = req.params;

    const server = await Server.findById(id);

    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    const cameraIds = server.cameras;

    const cameras = await Camera.find({ _id: { $in: cameraIds } });

    res.status(200).json(cameras);
  } catch (error) {
    console.error("Error al obtener las cámaras del servidor:", error);
    res
      .status(500)
      .json({ error: "Error al obtener las cámaras del servidor" });
  }
};

export const updateServer = async (req, res) => {
  try {
    const { id } = req.params;

    const { name, zone, mainIp, ipsRange, status, username, password, } = req.body;

    const server = await Server.findByIdAndUpdate(id, {
      name,
      zone,
      mainIp,
      ipsRange,
      status,
      username,
      password,
    });

    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    res.status(200).json({ message: "Servidor actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el servidor:", error);
    res.status(500).json({ error: "Error al actualizar el servidor" });
  }
};

export const deleteServer = async (req, res) => {
  try {
    const { id } = req.params;

    const server = await Server.findByIdAndDelete(id);

    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    const cameraIds = server.cameras.map((camera) => camera._id);

    if (cameraIds.length > 0) {
      await Camera.deleteMany({ _id: { $in: cameraIds } });
    }

    res
      .status(200)
      .json({ message: "Servidor y cámaras eliminados correctamente" });
  } catch (error) {
    console.error("Error al eliminar el servidor y las cámaras:", error);
    res
      .status(500)
      .json({ error: "Error al eliminar el servidor y las cámaras" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    const server = await Server.findByIdAndUpdate(id, { status });

    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    res
      .status(200)
      .json({ message: "Estado del servidor actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el estado del servidor:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar el estado del servidor" });
  }
};
