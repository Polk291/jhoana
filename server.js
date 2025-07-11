require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const connectDB = require("./config/bd");

const authRoutes = require("./routes/authRoutes");
const principalRoutes = require("./routes/principalRoutes");
const documentosRoute = require("./routes/documentosRoutes");

const app = express();

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "https://gestion-fupagua.vercel.app",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "Content-Disposition"],
  })
);

// Middleware
app.use(express.json());
connectDB();

// Rutas principales
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/principal", principalRoutes);
app.use("/api/v1/documentos", documentosRoute);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Carpeta de streaming temporal (Render solo permite escribir en /tmp)
const STREAM_PATH = "/tmp/streams";

// Crear carpeta general si no existe
if (!fs.existsSync(STREAM_PATH)) {
  fs.mkdirSync(STREAM_PATH, { recursive: true });
  console.log(`📁 Carpeta principal creada: ${STREAM_PATH}`);
}

// Servir los archivos de streaming al frontend
app.use("/streams", express.static(STREAM_PATH));

// 📷 Configuración de cámaras
const cameras = [
  {
    name: "camera1",
    url:
      process.env.RTSP_URL_1 ||
      "rtsp://FUPAGUA:FUPAGUA.123@192.168.0.103:554/stream1",
  },
  {
    name: "camera2",
    url:
      process.env.RTSP_URL_2 ||
      "rtsp://usuario:contraseña@IP_CAMARA_2:554/stream1",
  },
  {
    name: "camera3",
    url:
      process.env.RTSP_URL_3 ||
      "rtsp://usuario:contraseña@IP_CAMARA_3:554/stream1",
  },
];

// 🛠️ Iniciar FFmpeg por cada cámara
function startFFmpeg(camera) {
  const cameraPath = path.join(STREAM_PATH, camera.name);

  // Crear carpeta si no existe
  if (!fs.existsSync(cameraPath)) {
    fs.mkdirSync(cameraPath, { recursive: true });
    console.log(`📂 Carpeta creada para ${camera.name}: ${cameraPath}`);
  }

  const ffmpeg = spawn("ffmpeg", [
    "-i",
    camera.url,
    "-c:v",
    "libx264",
    "-preset",
    "ultrafast",
    "-f",
    "hls",
    "-hls_time",
    "2",
    "-hls_list_size",
    "5",
    "-hls_flags",
    "delete_segments",
    path.join(cameraPath, "index.m3u8"),
  ]);

  ffmpeg.stderr.on("data", (data) => {
    console.log(`FFmpeg [${camera.name}]: ${data.toString()}`);
  });

  ffmpeg.on("close", (code) => {
    console.log(`FFmpeg [${camera.name}] finalizó con código ${code}`);
  });
}

// 🚀 Lanzar los procesos de streaming
cameras.forEach(startFFmpeg);

// 🌐 Inicializar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;
