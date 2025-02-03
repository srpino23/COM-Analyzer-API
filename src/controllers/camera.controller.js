import { Types } from "mongoose";
import Server from "../models/Server";
import Camera from "../models/Camera";

export const addCamera = async (req, res) => {
  try {
    const {
      name,
      type,
      direction,
      zone,
      longitude,
      latitude,
      username,
      password,
      ip,
      serverId,
      liable,
    } = req.body;

    let message, data;

    const camera = new Camera({
      name,
      type,
      direction,
      zone,
      status: "online",
      longitude,
      latitude,
      username,
      password,
      ip,
      liable,
    });

    await camera.save();

    const server = await Server.findById(serverId);
    if (!server) {
      return res.status(404).json({ error: "Servidor no encontrado" });
    }

    server.cameras.push(camera._id);

    await server.save();

    message = "Cámara agregada correctamente al servidor";
    data = { camera, server };

    res.status(201).json({ message, data });
  } catch (error) {
    console.error("Error al agregar la cámara:", error);
    res.status(500).json({ error: "Error al agregar la cámara" });
  }
};

export const getCameras = async (req, res) => {
  try {
    const cameras = await Camera.find();

    res.status(200).json(cameras);
  } catch (error) {
    console.error("Error al obtener las camaras:", error);
    res.status(500).json({ error: "Error al obtener las camaras" });
  }
};

export const getCamera = async (req, res) => {
  try {
    const { id } = req.params;

    const camera = await Camera.findById(id);

    if (!camera) {
      return res.status(404).json({ error: "Cámara no encontrada" });
    }

    res.status(200).json(camera);
  } catch (error) {
    console.error("Error al obtener la camara:", error);
    res.status(500).json({ error: "Error al obtener la camara" });
  }
};

export const updateCamera = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      type,
      direction,
      zone,
      status,
      longitude,
      latitude,
      username,
      password,
      ip,
      liable,
    } = req.body;

    const camera = await Camera.findByIdAndUpdate(id, {
      name,
      type,
      direction,
      zone,
      status,
      longitude,
      latitude,
      username,
      password,
      ip,
      liable,
    });

    if (!camera) {
      return res.status(404).json({ error: "Cámara no encontrada" });
    }

    res.status(200).json({ message: "Camará actualizada correctamente" });
  } catch (error) {
    console.error("Error al actualizar la camara:", error);
    res.status(500).json({ error: "Error al actualizar la camara" });
  }
};

export const deleteCamera = async (req, res) => {
  try {
    const { id } = req.params;

    const objectId = Types.ObjectId.createFromHexString(id);

    const camera = await Camera.findByIdAndDelete(objectId);

    if (!camera) {
      return res.status(404).json({ error: "Cámara no encontrada" });
    }

    await Server.updateMany(
      { cameras: objectId },
      { $pull: { cameras: objectId } }
    );

    res.status(200).json({
      message: "Cámara eliminada correctamente y actualizada en el servidor",
    });
  } catch (error) {
    console.error("Error al eliminar la cámara:", error);
    res.status(500).json({ error: "Error al eliminar la cámara" });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const { status } = req.body;

    const camera = await Camera.findByIdAndUpdate(id, { status });

    if (!camera) {
      return res.status(404).json({ error: "Camara no encontrado" });
    }

    res
      .status(200)
      .json({ message: "Estado de la camara actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar el estado de la camara:", error);
    res
      .status(500)
      .json({ error: "Error al actualizar el estado de la camara" });
  }
};
