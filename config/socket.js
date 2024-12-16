// config/socket.js

const { Image } = require("../models/Images");

const setupSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("A client connected");

    // Send the latest QR code on connection
    Image.findOne()
      .sort({ createdAt: -1 })
      .then((latestImage) => {
        if (latestImage) {
          socket.emit("newQR", {
            qrCodeUrl: latestImage.qrCodeUrl,
            imagePath: latestImage.imagePath,
            imageUrl: latestImage.imageUrl,
          });
        }
      })
      .catch((err) => console.error("Error fetching latest image:", err));

    socket.on("disconnect", () => {
      console.log("A client disconnected");
    });
  });
};

module.exports = { setupSocket };
