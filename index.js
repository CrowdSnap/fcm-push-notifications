const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

// Inicializar Firebase Admin usando la variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Crear instancia de Express
const app = express();

// Middleware para parsear JSON
app.use(bodyParser.json());

// Definir puerto para el servidor
const port = process.env.PORT || 3000;

// Middleware para restringir acceso a otras rutas
app.use((req, res, next) => {
  if (req.path !== "/send-notification") {
    return res.status(404).send("Not Found");
  }
  next();
});

// Ruta para recibir notificaciones
app.post("/send-notification", async (req, res) => {
  const token = req.body.token;
  if (!token || token.length === 0) {
    res.status(400).send("Token inválido");
    return;
  }

  const title = req.body.title;
  const body = req.body.body;
  const img = req.body.img;
  const userId = req.body.userId;
  const username = req.body.username;
  const avatarUrl = req.body.avatarUrl;
  const blurHashImage = req.body.blurHashImage;

  if (!title || !body || !img || !userId || !username || !avatarUrl || !blurHashImage) {
    res.status(400).send("Todos los campos son requeridos");
    return;
  }

  const message = {
    notification: {
      title: title,
      body: body,
      image: img,
    },
    token: token,
    data: {
      userId: userId,
      username: username,
      avatarUrl: avatarUrl,
      blurHashImage: blurHashImage,
    },
  };

  try {
    await admin.messaging().send(message);
    res.status(200).send("Notificación enviada");
  } catch (error) {
    console.error("Error al enviar notificación:", error);
    res.status(500).send("Error al enviar notificación");
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});