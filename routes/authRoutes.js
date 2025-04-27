const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const {
  registroUsuario,
  loginUsuario,
  getUsuarioInfo,
  getPersonalInfo,
  deleteUserById,
  editarUsuario,
} = require("../controllers/authController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/registro", registroUsuario);
router.post("/login", loginUsuario);
router.get("/getUsuario", protect, getUsuarioInfo);
router.post("/upload-image", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se cargó la imagen!" });
  }
  const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;

  res.status(200).json({ imageUrl });
});
router.get("/personal", getPersonalInfo);
router.delete("/personal/:id", deleteUserById);
router.put("/usuario/:id", protect, editarUsuario);

module.exports = router;
