// index.js
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");

require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

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

const upload = multer({ storage });

// Upload route
app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ message: "File uploaded successfully" });
}, (err) => {
  console.log(err);
  res.status(400).send(err);
});

app.get("/show/:filename", (req, res) => {
  const filename = req.params.filename;

  gfs.find({ filename }).toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const readstream = gfs.openDownloadStreamByName(filename);
    readstream.on('error', (err) => {
      console.error(err);
      res.status(500).send('Server Error');
    });

    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : files[0].length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${files[0].length}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': files[0].contentType
      });

      readstream.pipe(res);
    } else {
      res.status(416).send('Range Not Satisfiable');
    }
  });
});



app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
