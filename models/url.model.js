const mongoose = require("mongoose");

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

module.exports = Url;
