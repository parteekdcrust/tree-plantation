const express = require("express");
const multer = require("multer");
const path = require("path");
const app = express();
const port = 5000;

app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

// Define the storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle form data and file upload
app.post("/upload", upload.single("photo"), (req, res) => {
  try {
    const { name, mobileNumber, email, walletAddress } = req.body;
    console.log(req.body);
    console.log(req.file);

    const photoPath = req.file ? req.file : null;

    // Here, we're just sending a JSON response with the received data
    res.status(201).json({
      name,
      mobileNumber,
      email,
      walletAddress,
      photoPath,
    });
  } catch (error) {
    res.status(400).json({
        message:"Error occured"
    })
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
