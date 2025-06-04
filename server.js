require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/bd");
const authRoutes = require("./routes/authRoutes");
const principalRoutes = require("./routes/principalRoutes");
const documentosRoute = require("./routes/documentosRoutes");
// Asegúrate de tenerlo instalado

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL || "https://gestion-dispositivos-seven.vercel.app",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Content-Disposition"],
  })
);

app.use(express.json());

connectDB();

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/principal", principalRoutes);
app.use("/api/v1/documentos", documentosRoute);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);

  // PING al servidor cada 4 segundos
  setInterval(() => {
    import("node-fetch").then(({ default: fetch }) => {
      const serverUrl = process.env.SERVER_URL || `http://localhost:${PORT}`;
      fetch(serverUrl)
        .then(() => console.log("Ping enviado al servidor"))
        .catch((err) => console.error("Error al hacer ping:", err.message));
    });
  }, 4000);
});

module.exports = app;
