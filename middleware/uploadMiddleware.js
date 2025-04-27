const multer = require("multer");

// Configuración del almacenamiento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
    // Nombre del archivo con timestamp para evitar colisiones
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Filtro de tipos de archivo permitidos
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "image/jpeg",
    "image/png",
    "image/jpg",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    cb(
      new Error(
        "Formato inválido! Solo se permiten PDF, Word, Excel, y algunas imágenes."
      ),
      false 
    );
  }
};

// Configuración de multer
const upload = multer({ storage, fileFilter });

module.exports = upload;
