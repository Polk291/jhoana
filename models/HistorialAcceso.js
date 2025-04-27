const mongoose = require("mongoose");

const HistorialAccesoSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Usuario", // Asegúrate de que existe un modelo Usuario
    },
    documento: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Documento", // Asegúrate de que existe un modelo Documento
    },
    accion: {
      type: String,
      required: true,
      enum: ["descarga", "edicion"], // Acciones permitidas
    },
    fecha: {
      type: Date,
      default: Date.now, // Fecha por defecto al momento de la creación
    },
  },
  { timestamps: true } // Agrega campos createdAt y updatedAt automáticamente
);

const HistorialAcceso = mongoose.model(
  "HistorialAcceso",
  HistorialAccesoSchema
);

module.exports = HistorialAcceso;
