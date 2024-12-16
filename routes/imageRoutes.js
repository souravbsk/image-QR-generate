// routes/imageRoutes.js
const express = require("express");

const imageRoutes = express.Router();
const path = require("path");
const fs = require("fs");

// Image folder paths
const imagesFolder = path.join(__dirname, "../images");

// Route for downloading images
imageRoutes.get("/:imageName", (req, res) => {
  const { imageName } = req.params;
  const imagePath = path.join(imagesFolder, imageName);

  // Check if the file exists
  if (fs.existsSync(imagePath)) {
    // Trigger file download
    res.download(imagePath, (err) => {
      if (err) {
        console.error("Error downloading file:", err);
        res.status(500).send("Error downloading the image.");
      }
    });
  } else {
    res.status(404).send("Image not found.");
  }
});

module.exports = imageRoutes;
