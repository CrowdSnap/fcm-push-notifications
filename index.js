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
  if (req.path !== "/send-notification" && req.path !== "/send-notifications") {
    return res.status(404).send("Not Found");
  }
  next();
});

// Ruta para enviar notificaciones a un solo token
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

  if (
    !title ||
    !body ||
    !img ||
    !userId ||
    !username ||
    !avatarUrl ||
    !blurHashImage
  ) {
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

// Ruta para enviar notificaciones a un listado de IDs de usuario
app.post("/send-notifications", async (req, res) => {
  const userIds = req.body.userIds;
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    res.status(400).send("Lista de IDs de usuario inválida");
    return;
  }

  const title = req.body.title;
  const body = req.body.body;
  const img = req.body.img;
  const userId = req.body.userId;
  const username = req.body.username;
  const avatarUrl = req.body.avatarUrl;
  const blurHashImage = req.body.blurHashImage;

  console.log("req.body", req.body);

  if (
    !title ||
    !body ||
    !img ||
    !username ||
    !avatarUrl ||
    !blurHashImage ||
    !userId
  ) {
    res.status(400).send("Todos los campos son requeridos");
    return;
  }

  try {
    const db = admin.firestore();
    const tokens = [];

    // Recuperar tokens de Firestore
    for (const userId of userIds) {
      const userDoc = await db.collection("users").doc(userId).get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        console.log("userData", userData);
        if (userData.fcmToken) {
          tokens.push(userData.fcmToken);
          console.log("Token añadido:", userData.fcmToken);
        }
      }
    }

    if (tokens.length === 0) {
      res.status(404).send("No se encontraron tokens válidos");
      return;
    }

    const message = {
      notification: {
        title: title,
        body: body,
        image: img,
      },
      tokens: tokens,
      data: {
        userId: userId,
        username: username,
        avatarUrl: avatarUrl,
        blurHashImage: blurHashImage,
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    res
      .status(200)
      .send(
        `Notificaciones enviadas: ${response.successCount} exitosas, ${response.failureCount} fallidas`
      );
  } catch (error) {
    console.error("Error al enviar notificaciones:", error);
    res.status(500).send("Error al enviar notificaciones");
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
