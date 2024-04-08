const Url = require("./models/url.model.js");

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

const getUrlShortened = async (req, res) => {
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
};
