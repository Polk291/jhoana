const Ayuda = require("../models/Ayuda");
const Configuracion = require("../models/Configuracion");
const Dispositivos = require("../models/Dispositivos");
const Documentos = require("../models/Documentos");
const Monitoreo = require("../models/Monitoreo");

exports.getPrincipalData = async (req, res) => {
  try {
    // Obtiene todos los documentos
    const documentos = await Documentos.find({});

    // Agrupar por clasificación, tipo y sensibilidad
    const clasificaciones = {};
    const tipos = {};
    const sensibilidades = {};

    documentos.forEach((doc) => {
      // Clasificación
      clasificaciones[doc.clasificacion] =
        (clasificaciones[doc.clasificacion] || 0) + 1;

      // Tipo
      tipos[doc.tipo] = (tipos[doc.tipo] || 0) + 1;

      // Sensibilidad
      sensibilidades[doc.sensibilidad] =
        (sensibilidades[doc.sensibilidad] || 0) + 1;
    });

    res.status(200).json({
      clasificaciones,
      tipos,
      sensibilidades,
    });
  } catch (error) {
    console.error("Error al obtener datos principales:", error);
    res.status(500).json({
      message: "Error al obtener datos principales",
      error: error.message,
    });
  }
};
