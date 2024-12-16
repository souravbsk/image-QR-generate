const path = require("path");
const { Image } = require("../models/Images");
const QRCode = require("qrcode");

const qrCodesFolder = path.join(__dirname, "../qr-codes");

// Controller to process new image
const processNewImage = async (filePath, io) => {
  const filename = path.basename(filePath);
  const imagePath = `/images/${filename}`; // Image URL path
  const qrCodeFile = `${filename.split(".")[0]}.png`;
  const qrCodePath = `/qr-codes/${qrCodeFile}`;

  // This is the URL where users can download the image after scanning the QR code
  const imageDownloadUrl = `${process.env.PUBLIC_URL}/download/${filename}`;
  const qrCodeUrl = `${process.env.PUBLIC_URL}${qrCodePath}`;

  try {
    // Check if the image already exists in the database
    const existingImage = await Image.findOne({ filename });

    if (existingImage) {
      console.log(`Image ${filename} already exists, skipping...`);
      return; // Skip saving if image exists
    }

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
      qrCodeUrl,
      imagePath,
      imageUrl: imageDownloadUrl, // URL to download the image
    });

    console.log(`Processed: ${filename}`);
  } catch (err) {
    console.error("Error processing image:", err);
  }
};

// Export the controller function
module.exports = {
  processNewImage,
};
