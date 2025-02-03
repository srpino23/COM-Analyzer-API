import User from "../models/User";

export const addUser = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    let message, data;

    const user = new User({
      username,
      password,
      email,
      role: "user",
    });

    await user.save();

    message = "Usuario agregado correctamente";
    data = user;

    res.status(201).json({ message, data });
  } catch (error) {
    console.error("Error al agregar el usuario:", error);
    res.status(500).json({ error: "Error al agregar el usuario" });
  }
};

export const getUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    let message, data;

    const user = await User.findOne({ username, password });

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    message = "Usuario obtenido correctamente";
    data = user;

    res.status(200).json({ message, data });
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({ error: "Error al obtener el usuario" });
  }
};
