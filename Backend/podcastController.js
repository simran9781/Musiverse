const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

// --------------------- MongoDB Connection Setup ---------------------
const uri = "mongodb://localhost:27017/music_player";
const dbName = "music_player";
let db;

// Connect to MongoDB
MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then((client) => {
    db = client.db(dbName);
  })
  .catch((error) => {
    console.error("Failed to connect to MongoDB", error);
  });

// --------------------- File Upload Configuration ---------------------

// Configure Multer for handling file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "audio") {
      const audioDir = path.join(__dirname, "/public/audios");
      if (!fs.existsSync(audioDir)) {
        fs.mkdirSync(audioDir, { recursive: true });
      }
      cb(null, audioDir);
    } else if (file.fieldname === "image") {
      const imageDir = path.join(__dirname, "/public/uploads");
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
      }
      cb(null, imageDir);
    } else {
      cb(new Error("Invalid field name for file upload"), false);
    }
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Define a file filter to restrict allowed file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["audio/mpeg", "audio/mp3", "image/jpg", "image/png", "image/webp","image/jpeg"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    console.error("Invalid file type:", file.mimetype);
    cb(new Error("Invalid file type. Only MP3, JPEG, and PNG are allowed."), false);
  }
};

// Configure Multer with storage and file filter settings
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter,
});

// Middleware for handling song uploads
const uploadpodcast = upload.fields([
  { name: "audio", maxCount: 1 },
  { name: "image", maxCount: 1 },
]);

// --------------------- Podcast Upload Controller ---------------------

const addpodcast = (req, res) => {
  try {
    console.log("Request Body:", req.body);

    if (!req.files || !req.files.audio || !req.files.image) {
      console.error("Missing files: audio or image not uploaded.");
      return res.status(400).json({ error: "Audio or Image file is missing." });
    }

    const { title, podcastName} = req.body;

    if (!title || !podcastName || !req.files.audio || !req.files.image) {
      return res.status(400).json({ error: "Required fields missing: songName, artistName, audio, or image" });
    }

    const audioFileName = req.files.audio[0].filename;
    const imageFileName = req.files.image[0].filename;

    const songData = {
      title,
      podcastName: podcastName || "Unknown",
      audio: audioFileName,
      image: imageFileName,
    };

    const podcastCollection = db.collection("Podcast_Episodes");
    podcastCollection
      .insertOne(songData)
      .then((result) => {
        res.status(200).json({ message: "Podcast uploaded successfully", songData });
      })
      .catch((error) => {
        console.error("Error saving podcast data to MongoDB:", error);
        res.status(500).json({ error: "Failed to save podcast data to MongoDB" });
      });
  } catch (error) {
    console.error("Error in Podcast controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { uploadpodcast, addpodcast };
