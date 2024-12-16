// app.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const chokidar = require("chokidar");
const { connectDB } = require("./config/db");
const { setupSocket } = require("./config/socket");
const { processNewImage } = require("./controllers/imageController");
const imageRoutes = require("./routes/imageRoutes");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });

// Database Connection
connectDB();

// Middleware to serve static files
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/qr-codes", express.static(path.join(__dirname, "qr-codes")));
app.use("/download", imageRoutes);

// Socket.IO Setup
setupSocket(io);

// Watch for new files in the images folder
const imagesFolder = path.join(__dirname, "images");
const watcher = chokidar.watch(imagesFolder, { persistent: true });

watcher.on("add", (filePath) => {
  // Process the new image file and emit the QR code to the clients
  processNewImage(filePath, io);
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
