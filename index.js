const express = require("express");
const admin = require("firebase-admin");
const bodyParser = require("body-parser");

// Inicializar Firebase Admin
const serviceAccount = require("./firebase-credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Crear instancia de Express
const app = express();

// Middleware para parsear JSON
app.use(bodyParser.json());

// Definir puerto para el servidor
const port = process.env.PORT || 3000;

// Ruta para recibir notificaciones
app.post("/send-notification", async (req, res) => {
  // Obtener token del dispositivo
  const token = req.body.token;

  // Validar token
  if (!token || token.length === 0) {
    res.status(400).send("Token inválido");
    return;
  }

  // Obtener datos de la notificación
  const title = req.body.title;
  const body = req.body.body;
  const img = req.body.img;

  // Validar datos de la notificación
  if (!title || !body || !img) {
    res
      .status(400)
      .send("Título, cuerpo e imagen de la notificación son requeridos");
    return;
  }

  // Preparar mensaje de la notificación
  const message = {
    notification: {
      title: title,
      body: body,
      image: img,
    },
    token: token,
  };

  // Enviar notificación a través de Firebase Messaging
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