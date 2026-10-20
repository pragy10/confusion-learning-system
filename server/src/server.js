const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const eventsRouter = require("./routes/events");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "backend",
    mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.use("/api/events", eventsRouter);

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected.");
    } catch (error) {
      console.warn("MongoDB connection failed (running in fallback mode):", error.message);
    }
  } else {
    console.warn("MONGODB_URI is not set. Events persistence disabled.");
  }

  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

startServer();
