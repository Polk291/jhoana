const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UsuarioSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    usuario: { type: String, required: true },
    clave: { type: String, required: true },
    claveSecreta: { type: String, required: true, unique: true },
    perfilFoto: { type: String, default: null },
    rol: {
      type: String,
      enum: [
        "admin",
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
      ],
      required: true,
    },
    ultimaFechaRespaldo: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

UsuarioSchema.pre("save", async function (next) {
  if (!this.isModified("clave")) return next();
  this.clave = await bcrypt.hash(this.clave, 10);

  if (this.isModified("claveSecreta")) {
    this.claveSecreta = await bcrypt.hash(this.claveSecreta, 10);
  }

  next();
});

UsuarioSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.clave);
};

UsuarioSchema.methods.compareClaveSecreta = async function (
  candidateClaveSecreta
) {
  return await bcrypt.compare(candidateClaveSecreta, this.claveSecreta);
};

module.exports = mongoose.model("Usuario", UsuarioSchema);
