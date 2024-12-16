// models/Images.js
const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    imagePath: { type: String, required: true },
    qrCodePath: { type: String, required: true },
    qrCodeUrl: { type: String, required: true },
    imageUrl: { type: String, required: true },
  },
  { timestamps: true }
);

const Image = mongoose.model("Image", imageSchema);

module.exports = { Image };
