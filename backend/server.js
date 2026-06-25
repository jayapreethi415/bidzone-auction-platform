const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const auctionRoutes = require("./routes/auctionRoutes");

const app = express();

app.use(cors({
  origin: "https://bidzone-frontend-z0w6.onrender.com"
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/auctions", auctionRoutes);

app.get("/", (req, res) => {
  res.send("BidZone backend running...");
});

console.log("Using DB:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));