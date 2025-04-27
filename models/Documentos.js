const mongoose = require("mongoose");
const HistorialAccesoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Usuario",
    },
    documento: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Documento",
    },
    accion: {
      type: String,
      required: true,
      enum: ["descarga", "edicion"],
    },
    fecha: { type: Date, default: Date.now },
  },
  { _id: false }
);

const ResguardoSchema = new mongoose.Schema(
  {
    metodo: {
      type: String,
      enum: ["local", "nube"],
      required: true,
    },
    frecuencia: {
      type: String,
      enum: ["diaria", "semanal", "mensual"],
      default: "diaria",
    },
    estado: {
      type: String,
      enum: ["completado", "pendiente", "fallido"],
      default: "pendiente",
    },
    cifrado: {
      type: String,
      required: true,
    },
    ultimaFechaRespaldo: {
      type: Date, // Este campo almacenará la fecha del último respaldo
    },
  },
  { _id: false }
);

const DocumentoSchema = new mongoose.Schema(
  {
    nombreArchivo: { type: String, required: true },
    tipo: { type: String, required: true },
    fechaCreacion: { type: Date, default: Date.now },
    tamano: { type: Number, required: true },
    url: { type: String, required: true },
    clasificacion: {
      type: String,
      enum: ["Público", "Interno", "Confidencial", "Secreto"],
      required: true,
    },
    sensibilidad: {
      type: String,
      enum: ["Baja", "Media", "Alta"],
      required: true,
    },
    propietario: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Usuario",
    },
    permisos: {
      type: [String],
      enum: ["Lectura", "Escritura", "Admin"],
      default: ["Lectura"],
    },
    historialAcceso: [HistorialAccesoSchema],
    resguardo: ResguardoSchema,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Documento", DocumentoSchema);
