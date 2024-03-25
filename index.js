require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const { body, validationResult } = require("express-validator");
let bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
const mongoose = require("mongoose");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

mongoose.connect(process.env.MONGO_URI);

let urlSchema = new mongoose.Schema({
  originalUrl: {
    type: String,
    require: true,
    unique: true,
  },
  shortUrl: {
    type: Number,
    require: true,
    unique: true,
  },
});

let Url = mongoose.model("Url", urlSchema);

const createAndSaveUrl = async (originalUrl, shortUrl) => {
  const urlNew = new Url({
    originalUrl,
    shortUrl,
  });
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
        return res.json({ error: "invalid url" });
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
      res.status(404).json({ error: "shortUrl does not exist" });
    }
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
