const express = require("express");
require("dotenv").config();
const app = express();
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const datasetRoutes = require("./routes/create_dataset");
const contributeRoutes = require("./routes/contribute");

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api", datasetRoutes);
app.use("/api", contributeRoutes);

module.exports = app;
