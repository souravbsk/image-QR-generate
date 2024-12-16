const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const chokidar = require("chokidar");
const QRCode = require("qrcode");
const path = require("path");
const fs = require("fs");
const { Image } = require("./models/Images");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

const PORT = process.env.PORT || 3000;
const imagesFolder = path.join(__dirname, "images");
const qrCodesFolder = path.join(__dirname, "qr-codes");

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the process if the database connection fails
  });

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(imagesFolder));
app.use("/qr-codes", express.static(qrCodesFolder));

// Ensure folders exist
if (!fs.existsSync(imagesFolder)) fs.mkdirSync(imagesFolder);
if (!fs.existsSync(qrCodesFolder)) fs.mkdirSync(qrCodesFolder);

// Watch for new files in the images folder
const watcher = chokidar.watch(imagesFolder, { persistent: true });

watcher.on("add", async (filePath) => {
  const filename = path.basename(filePath);
  const imagePath = `/images/${filename}`; // Image URL path
  const qrCodeFile = `${filename.split(".")[0]}.png`;
  const qrCodePath = `/qr-codes/${qrCodeFile}`;

  // This is the URL where users can download the image after scanning the QR code
  const imageDownloadUrl = `${process.env.PUBLIC_URL}/download/${filename}`;
  const qrCodeUrl = `${process.env.PUBLIC_URL}${qrCodePath}`;

  try {
    // Generate QR code with the image download URL (not the image itself)
    await QRCode.toFile(
      path.join(qrCodesFolder, qrCodeFile),
      imageDownloadUrl // This is the URL for downloading the image
    );

    // Save metadata to MongoDB
    const image = new Image({
      filename,
      imagePath,
      qrCodePath,
      qrCodeUrl,
      imageUrl: imageDownloadUrl,
    });
    await image.save();

    // Emit the latest QR code to clients
    io.emit("newQR", {
      qrCodeUrl, // QR code image URL
      imagePath, // User's image URL
      imageUrl: imageDownloadUrl, // URL to download the image
    });
    console.log(`Processed: ${filename}`);
  } catch (err) {
    console.error("Error processing image:", err);
  }
});

// Route to handle image download
app.get("/download/:imageName", (req, res) => {
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

// Handle client connections
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

// Start the server
server.listen(PORT, () => {
  console.log(process.env.PUBLIC_URL);
  console.log(`Server running on port ${PORT}`);
});
