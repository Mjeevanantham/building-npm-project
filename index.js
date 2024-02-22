const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const cors = require("cors"); // Import the cors middleware

require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Use cors middleware
app.use(cors());

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });
const conn = mongoose.connection;

// Initialize GridFS
let gfs;

conn.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: "uploads",
  });
});

// Create storage engine
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return {
      filename: file.originalname,
      bucketName: "uploads",
    };
  },
});

const upload = multer({ storage,
  limits:{
  fileSize: 1024 * 1024 * 500
} });

// Upload route
app.post("/upload", upload.single("file"), (req, res, next) => {
  if (!req.file) {
    return res.status(400).send("<h1>No file uploaded</h1>");
  }
  res.send(`
    <h1>File uploaded successfully</h1>
    <p>Filename: ${req.file.originalname}</p>
  `);
});

// Serve the HTML page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// Stream video route
app.get("/show/:filename", (req, res) => {
  const filename = req.params.filename;

  new Promise((resolve, reject) => {
    gfs.find({ filename }).toArray((err, files) => {
      if (err) {
        reject(err);
      } else if (!files || files.length === 0) {
        reject(new Error("File not found"));
      } else {
        resolve(files[0]);
      }
    });
  })
    .then((file) => {
      const readstream = gfs.openDownloadStreamByName(filename);

      readstream.on("error", (err) => {
        console.error(err);
        res.status(500).send("Server Error");
      });

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : file.length - 1;
        const chunksize = end - start + 1;

        res.writeHead(206, {
          "Content-Range": `bytes ${start}-${end}/${file.length}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunksize,
          "Content-Type": file.contentType,
        });

        readstream.pipe(res);
      } else {
        res.status(416).send("Range Not Satisfiable");
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Server Error");
    });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
