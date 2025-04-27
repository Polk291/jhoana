const Usuario = require("../models/Usuario");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "1h" });
};

exports.registroUsuario = async (req, res) => {
  const { nombre, usuario, clave, claveSecreta, perfilFoto, rol } = req.body;

  const rolesPermitidos = [
    "terapiaOcupacional",
    "fisioterapia",
    "psicologia",
    "psicopedagogía",
    "fonoaudiología",
    "aulaIntegral",
    "cultura",
    "nivelación",
    "vigilante",
    "directora",
  ];

  if (!nombre || !usuario || !clave || !claveSecreta || !rol) {
    return res
      .status(400)
      .json({ message: "Todos los campos son requeridos!" });
  }

  if (!rolesPermitidos.includes(rol)) {
    return res.status(400).json({ message: "Rol no válido!" });
  }

  try {
    const user = await Usuario.create({
      nombre,
      usuario,
      clave,
      claveSecreta,
      perfilFoto,
      rol,
    });

    res.status(201).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Error al registrar Usuario:", error);
    res
      .status(500)
      .json({ message: "Error al registrar Usuario!", error: error.message });
  }
};

exports.loginUsuario = async (req, res) => {
  const { usuario, clave, claveSecreta, rol } = req.body;

  if (!usuario || !clave || !claveSecreta || !rol) {
    return res
      .status(400)
      .json({ message: "Todos los campos son requeridos!" });
  }

  try {
    const user = await Usuario.findOne({ usuario, rol });

    if (
      !user ||
      !(await user.comparePassword(clave)) ||
      !(await user.compareClaveSecreta(claveSecreta))
    ) {
      return res.status(400).json({
        message: "Credenciales Inválidas!",
      });
    }

    res.status(200).json({
      id: user._id,
      user,
      token: generateToken(user._id),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al iniciar sesión!", error: error.message });
  }
};

exports.getUsuarioInfo = async (req, res) => {
  try {
    const user = await Usuario.findById(req.usuario.id).select("-clave");
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado!" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al buscar el usuario!", error: error.message });
  }
};

exports.getPersonalInfo = async (req, res) => {
  try {
    // Busca todos los usuarios y selecciona los campos relevantes
    const usuarios = await Usuario.find({}, "nombre usuario rol perfilFoto");

    // Si no se encuentran usuarios, devuelve un mensaje apropiado
    if (!usuarios || usuarios.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron usuarios.",
      });
    }

    // Responde con los usuarios encontrados
    return res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    // Manejo de errores
    console.error("Error al obtener la información de los usuarios:", error);
    return res.status(500).json({
      success: false,
      message: "Error al obtener la información de los usuarios.",
      error: error.message, // Agrega el mensaje de error para más contexto
    });
  }
};

exports.deleteUserById = async (req, res) => {
  const { id } = req.params; // Asegúrate de que 'id' sea un ObjectId válido

  try {
    // Intenta convertir el id a ObjectId antes de buscar
    const deletedUser = await Usuario.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ success: false, message: "Usuario no encontrado" });
    }

    res
      .status(200)
      .json({ success: true, message: "Usuario eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    if (error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ success: false, message: "ID de usuario inválido" });
    }
    res
      .status(500)
      .json({ success: false, message: "Error al eliminar el usuario" });
  }
};

exports.editarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, usuario, clave, claveSecreta } = req.body;

  try {
    const usuarioEncontrado = await Usuario.findById(id);
    if (!usuarioEncontrado) {
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    usuarioEncontrado.nombre = nombre || usuarioEncontrado.nombre;
    usuarioEncontrado.usuario = usuario || usuarioEncontrado.usuario;

    if (clave) {
      usuarioEncontrado.clave = clave;
    }
    if (claveSecreta) {
      usuarioEncontrado.claveSecreta = claveSecreta;
    }

    await usuarioEncontrado.save();
    return res
      .status(200)
      .json({ mensaje: "Usuario actualizado exitosamente" });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ mensaje: "Error al actualizar el usuario", error });
  }
};
