const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes")
const cors = require("cors")
const postRoutes = require("./routes/postRoutes")

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());//keep it before routes, because express reads middleware top to bottom
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "JanSetu backend is running",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});