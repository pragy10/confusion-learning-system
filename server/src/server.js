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
  });
});

app.use("/api/events", eventsRouter);

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected.");

    app.listen(PORT, () => {
      console.log(
        `Backend running on http://localhost:${PORT}`
      );
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error
    );

    process.exit(1);
  }
}

startServer();