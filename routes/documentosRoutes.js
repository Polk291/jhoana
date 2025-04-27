const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const Documento = require("../models/Documentos");
const {
  obtenerDocumentos,
  getDocumentoInfo,
  eliminarDocumento,
  descargarDocumento,
  respaldarDocumentos,
  consultarDocumentos,
  registrarHistorialAcceso,
  historialAcceso,
} = require("../controllers/documentosController");

const router = express.Router();

// Ruta para subir un documento
router.post("/subir", protect, upload.single("archivo"), async (req, res) => {
  const { nombreArchivo, tipo, clasificacion, sensibilidad, permisos } =
    req.body;

  // Verifica que el archivo se haya cargado
  if (!req.file) {
    return res.status(400).json({ message: "No se cargó el documento!" });
  }

  // Verifica que todos los campos requeridos estén presentes
  if (!nombreArchivo || !tipo || !clasificacion || !sensibilidad) {
    return res
      .status(400)
      .json({ message: "Todos los campos son requeridos!" });
  }

  const documentUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  try {
    const nuevoDocumento = new Documento({
      nombreArchivo,
      tipo,
      tamano: req.file.size,
      url: documentUrl,
      clasificacion,
      sensibilidad,
      propietario: req.usuario.id,
      permisos: permisos ? JSON.parse(permisos) : [],
    });

    const documentoGuardado = await nuevoDocumento.save();
    res.status(201).json(documentoGuardado);
  } catch (error) {
    console.error("Error al crear el documento:", error);
    res
      .status(500)
      .json({ message: "Error al crear el documento!", error: error.message });
  }
});

// Ruta para obtener todos los documentos
router.get("/", protect, obtenerDocumentos);

// Ruta para obtener información de un documento por ID
router.patch("/:id", protect, getDocumentoInfo);
// Ruta para editar un documento por ID
router.put("/editar/:id", protect, async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, clasificacion, sensibilidad, permisos } = req.body;

  try {
    const documento = await Documento.findByIdAndUpdate(
      id,
      { nombre, tipo, clasificacion, sensibilidad, permisos },
      { new: true, runValidators: true }
    );

    if (!documento) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }

    res.status(200).json(documento);
  } catch (error) {
    console.error("Error al editar el documento:", error);
    res
      .status(500)
      .json({ message: "Error al editar el documento", error: error.message });
  }
});

// Ruta para eliminar un documento por ID
router.delete("/:id", protect, eliminarDocumento);

// Ruta para descargar un documento por ID
router.get("/descargar/:id", protect, descargarDocumento);

// Ruta para respaldar documentos
router.post("/respaldo", protect, respaldarDocumentos);

// Ruta para guardar la fecha del respaldo
router.get("/documentos", consultarDocumentos);

router.post("/historial", protect, registrarHistorialAcceso);

router.get("/historial-acceso", historialAcceso);

module.exports = router;
