require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const Url = require("./models/url.model.js");

app.use(express.json()); //Para poder procesar el body de las solicitudes POST
app.use(express.urlencoded({ extended: true })); //
app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", async (req, res) => {
  try {
    const urls = await Url.find({});
    res.json(urls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Basic Configuration
const port = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to database!");
    app.listen(port, function () {
      console.log(`Listening on port ${port}`);
    });
  })
  .catch(() => {
    console.log("Connection failed!");
  });

const createAndSaveUrl = async (originalUrl, shortUrl) => {
  const urlNew = new Url({
    originalUrl,
    shortUrl,
  }); //Tambien con la sintaxis .create() es posible (averiguar)
  try {
    const data = await urlNew.save();
    console.log(data, "Se ha guardado exitosamente");
  } catch (err) {
    console.error(err);
  }
};

const findUrlSaved = async (urlToFind) => {
  try {
    const result = await Url.findOne(urlToFind);
    if (result) {
      console.log("Documento encontrado:", result);
      return result;
    } else {
      console.log("No se encontró el documento.");
      return false;
    }
  } catch (err) {
    console.error("Error al buscar el documento:", err);
  }
};

app.post(
  "/api/shorturl",
  [
    // Validar que 'url' sea una URL válida
    body("url")
      .isURL({
        require_tld: false, // No requerir un dominio de nivel superior
        require_protocol: true, // Requerir que la URL tenga un protocolo como http o https
      })
      .withMessage(
        "Ingrese una URL válida que comience con http://www. o https://www."
      ),
  ],
  async (req, res) => {
    try {
      console.log(req.body, "Principal");
      // Verificar si hay errores de validación
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.json({ error: "invalid url" }); //Deberia ser res.status(400).json({ error: "invalid url" }) ... Pero no se incluye por conflicto con el test de FCC
      }
      const original_url = req.body.url;

      const urlExistsDocument = await findUrlSaved({
        originalUrl: original_url,
      });
      if (!urlExistsDocument) {
        const short_url = Math.round(Math.random() * 1000000);
        createAndSaveUrl(original_url, short_url);
        res.json({
          original_url,
          short_url,
        });
      } else {
        res.json({
          original_url: urlExistsDocument.originalUrl,
          short_url: urlExistsDocument.shortUrl,
        });
      }
    } catch (err) {
      console.log("Error al procesar la solicitud.");
      res.status(500).json({ error: "Error al procesar la solicitud." });
    }
  }
);

app.get("/api/shorturl/:url", async (req, res) => {
  try {
    const shortUrl = req.params.url; // Parametros de Ruta
    const urlExistsDocument = await findUrlSaved({ shortUrl: shortUrl });
    if (urlExistsDocument) {
      res.redirect(urlExistsDocument.originalUrl);
    } else {
      res.json({ error: "shortUrl does not exist" }); //Deberia ser: res.status(400).json({ error: "shortUrl does not exist" })... Estatus 400: Bad Request: La solicitud por parte del cliente no es válida o falta algún parámetro.
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" }); //500 Internal Server Error: Error interno del servidor.
  }
});
