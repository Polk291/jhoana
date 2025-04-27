const Documento = require("../models/Documentos");
const HistorialAcceso = require("../models/HistorialAcceso");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

exports.crearDocumento = async (req, res) => {
  const {
    nombreArchivo,
    tipo,
    tamano,
    clasificacion,
    sensibilidad,
    propietario,
    permisos,
    resguardo,
  } = req.body;

  // Validar campos requeridos
  if (
    !nombreArchivo ||
    !tipo ||
    !tamano ||
    !clasificacion ||
    !sensibilidad ||
    !propietario
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son requeridos!" });
  }

  try {
    const nuevoDocumento = new Documento({
      nombreArchivo: nombreArchivo, // Asignar el nombre del archivo
      tipo,
      tamano,
      url: req.file.path, // Asegúrate de que el archivo se haya procesado correctamente
      clasificacion,
      sensibilidad,
      propietario,
      permisos: permisos || [],
      resguardo: JSON.parse(resguardo),
    });

    const documentoGuardado = await nuevoDocumento.save();

    res.status(201).json(documentoGuardado);
  } catch (error) {
    console.error("Error al crear el documento:", error);
    res
      .status(500)
      .json({ message: "Error al crear el documento!", error: error.message });
  }
};

exports.obtenerDocumentos = async (req, res) => {
  try {
    const documentos = await Documento.find().populate(
      "propietario",
      "nombre rol"
    );

    const documentosConPropietario = documentos.map((doc) => ({
      ...doc._doc,
      propietario: {
        nombre: doc.propietario ? doc.propietario.nombre : "Desconocido",
        rol: doc.propietario ? doc.propietario.rol : "Desconocido",
      },
    }));

    res.status(200).json(documentosConPropietario);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener documentos!", error: error.message });
  }
};
exports.getDocumentoInfo = async (req, res) => {
  const { id } = req.params;

  try {
    const documento = await Documento.findById(id);
    if (!documento) {
      return res.status(404).json({ message: "Documento no encontrado!" });
    }

    const updates = {
      ...(req.body.nombreArchivo && { nombreArchivo: req.body.nombreArchivo }),
      ...(req.body.tipo && { tipo: req.body.tipo }),
      ...(req.body.clasificacion && { clasificacion: req.body.clasificacion }),
      ...(req.body.sensibilidad && { sensibilidad: req.body.sensibilidad }),
      ...(req.body.permisos && { permisos: req.body.permisos }),
    };

    if (req.body.resguardo) {
      updates.resguardo = {
        ...(req.body.resguardo.metodo && { metodo: req.body.resguardo.metodo }),
        ...(req.body.resguardo.frecuencia && {
          frecuencia: req.body.resguardo.frecuencia,
        }),
        ...(req.body.resguardo.estado && { estado: req.body.resguardo.estado }),
        ...(req.body.resguardo.cifrado && {
          cifrado: req.body.resguardo.cifrado,
        }),
        ...(req.body.resguardo.ultimaFechaRespaldo && {
          ultimaFechaRespaldo: req.body.resguardo.ultimaFechaRespaldo,
        }),
      };
    }

    Object.assign(documento, updates);
    await documento.save();

    return res
      .status(200)
      .json({ message: "Documento actualizado!", documento });
  } catch (error) {
    console.error("Error al actualizar el documento:", error);
    res.status(500).json({
      message: "Error al buscar o actualizar el documento!",
      error: error.message,
    });
  }
};
exports.eliminarDocumento = async (req, res) => {
  const { id } = req.params;

  try {
    const documentoEliminado = await Documento.findByIdAndDelete(id);
    if (!documentoEliminado) {
      return res.status(404).json({ message: "Documento no encontrado!" });
    }
    res.status(200).json({ message: "Documento eliminado correctamente!" });
  } catch (error) {
    console.error("Error al eliminar el documento:", error);
    res.status(500).json({
      message: "Error al eliminar el documento!",
      error: error.message,
    });
  }
};

exports.descargarDocumento = async (req, res) => {
  const { id } = req.params; // Recibir el ID del documento

  try {
    // Busca el documento e incluye el detalle del propietario
    const documento = await Documento.findById(id).populate("propietario");

    if (!documento) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }

    if (!documento.url) {
      return res
        .status(400)
        .json({ message: "La URL del archivo no está definida" });
    }

    // Obtiene el nombre del archivo a partir de la URL
    const filePath = path.join(
      __dirname,
      "../uploads",
      path.basename(documento.url)
    ); // Ruta al archivo en el servidor

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Archivo no encontrado" });
    }

    const ext = path.extname(filePath).toLowerCase(); // Obtener la extensión del archivo
    const fechaActual = new Date();
    const fechaString = `${fechaActual.getFullYear()}-${String(
      fechaActual.getMonth() + 1
    ).padStart(2, "0")}-${String(fechaActual.getDate()).padStart(2, "0")}`;

    const nombreArchivo = documento.nombreArchivo || "documento"; // Nombre por defecto si no se encuentra

    // Acceder al nombre del propietario
    const propietario = documento.propietario
      ? documento.propietario.nombre || "desconocido"
      : "desconocido"; // Obtener el nombre del propietario, asegurando que existe

    // Generar el nuevo nombre del archivo en el formato solicitado
    const nuevoNombre = `${nombreArchivo}-${propietario}-${fechaString}${ext}`;

    // Determinar el tipo de contenido
    let contentType;
    switch (ext) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".doc":
        contentType = "application/msword";
        break;
      case ".docx":
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        break;
      case ".xls":
        contentType = "application/vnd.ms-excel";
        break;
      case ".xlsx":
        contentType =
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      default:
        contentType = "application/octet-stream"; // Tipo de contenido genérico
    }

    // Enviar la información del documento al cliente
    return res.status(200).json({
      fileName: nuevoNombre,
      fileType: contentType,
      fileUrl: `/uploads/${path.basename(documento.url)}`, // Enlace que el frontend usará para descargar el archivo
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Error al obtener información del documento",
      error: error.message,
    });
  }
};
exports.editarDocumento = async (req, res) => {
  const { id } = req.params; // Obtener el ID del documento a editar
  const { nombre, tipo, clasificacion, sensibilidad, permisos } = req.body; // Obtener los nuevos datos del cuerpo de la solicitud

  try {
    // Busca y actualiza el documento en la base de datos
    const documento = await Documento.findByIdAndUpdate(
      id,
      { nombre, tipo, clasificacion, sensibilidad, permisos },
      { new: true, runValidators: true } // Devuelve el documento actualizado y valida antes de guardar
    );

    if (!documento) {
      return res.status(404).json({ message: "Documento no encontrado" });
    }

    // Devuelve el documento actualizado
    res.status(200).json(documento);
  } catch (error) {
    console.error("Error al editar el documento:", error);
    res
      .status(500)
      .json({ message: "Error al editar el documento", error: error.message });
  }
};

exports.respaldarDocumentos = async (req, res) => {
  try {
    // Obtener todos los documentos
    const documentos = await Documento.find();

    // Crear contenido para el respaldo
    const respaldoContent = JSON.stringify(documentos, null, 2);

    // Generar el hash SHA-256 del contenido del respaldo
    const hash = crypto
      .createHash("sha256")
      .update(respaldoContent)
      .digest("hex");

    // Crear un nombre de archivo único para el respaldo
    const timestamp = new Date().toISOString().replace(/[-:.]/g, "");
    const backupFileName = `respaldo-${timestamp}.json`;

    // Guardar el respaldo en un archivo local
    const backupPath = path.join(__dirname, "../backups", backupFileName);
    fs.writeFileSync(backupPath, respaldoContent, "utf-8");

    // Guardar el hash en un archivo separado
    fs.writeFileSync(`${backupPath}.hash`, hash, "utf-8");

    // Actualizar la fecha de respaldo en los documentos
    const fechaActual = new Date();
    await Documento.updateMany(
      {},
      { $set: { "resguardo.ultimaFechaRespaldo": fechaActual } }
    );

    res.status(200).json({
      message: "Respaldo realizado correctamente",
      hash: hash,
      backupFileName: backupFileName,
      fechaRespaldo: fechaActual, // Incluimos la fecha en la respuesta
    });
  } catch (error) {
    console.error("Error al realizar el respaldo:", error);
    res.status(500).json({
      message: "Error al realizar el respaldo",
      error: error.message,
    });
  }
};
exports.consultarDocumentos = async (req, res) => {
  try {
    // Obtener todos los documentos
    const documentos = await Documento.find();

    // Crear un objeto con la información necesaria
    const informacion = documentos.map((doc) => ({
      id: doc._id,
      nombreArchivo: doc.nombreArchivo,
      tipo: doc.tipo,
      clasificacion: doc.clasificacion,
      sensibilidad: doc.sensibilidad,
      permisos: doc.permisos,
      tamano: doc.tamano,
      propietario: doc.propietario,
      ultimaFechaRespaldo: doc.resguardo
        ? doc.resguardo.ultimaFechaRespaldo
        : null,
    }));

    res.status(200).json({
      message: "Documentos consultados correctamente",
      documentos: informacion,
    });
  } catch (error) {
    console.error("Error al consultar documentos:", error);
    res.status(500).json({
      message: "Error al consultar documentos",
      error: error.message,
    });
  }
};

exports.registrarHistorialAcceso = async (req, res) => {
  const { documentoId, accion } = req.body;
  const usuarioId = req.usuario._id;

  // Validaciones
  if (!documentoId || !accion) {
    return res.status(400).json({ error: "Faltan datos requeridos." });
  }

  if (!["descarga", "edicion"].includes(accion)) {
    return res.status(400).json({ error: "Acción no válida." });
  }

  try {
    const nuevoHistorial = new HistorialAcceso({
      usuario: usuarioId,
      documento: documentoId,
      accion: accion,
      fecha: new Date(),
    });

    await nuevoHistorial.save();
    return res
      .status(200)
      .json({ message: "Historial de acceso registrado correctamente." });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: "Error al registrar el historial de acceso." });
  }
};

exports.historialAcceso = async (req, res) => {
  try {
    const historial = await HistorialAcceso.find()
      .populate("usuario", "nombre rol")
      .populate("documento", "nombreArchivo tipo")
      .sort({ fecha: -1 });

    res.status(200).json(historial);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ mensaje: "Error al obtener el historial de acceso." });
  }
};
