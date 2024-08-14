import dotenv from "dotenv";
import express from "express";

import helloDetectorController from "./hello-detector/controller";

// Global configs
//
dotenv.config();
const PORT = process.env.PORT;
const { name, version } = require("../package.json");

// App setup
//
const app = express();
app.use(express.json());

// Version routes
//
app.get("/version", (req, res) => {
    res.json({ name, version });
});

// Detector routes
//
app.use("/detect", helloDetectorController);

// Start the server
//
const server = app.listen(PORT, () => {
    console.log(`Custom Detector is running on http://localhost:${PORT}`);
});

// Exports
//
export { app, server };
