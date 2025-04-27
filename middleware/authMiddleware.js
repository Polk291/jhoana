const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");


exports.protect = async (req, res, next) => {
  let token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No Autorizado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Token inválido" });
    }

    req.usuario = await Usuario.findById(decoded.id).select("-clave");
    
    
    if (!req.usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    next();
  } catch (error) {
    console.error("Error al verificar el token:", error);
    res.status(401).json({ message: "Token Fallido" });
  }
};