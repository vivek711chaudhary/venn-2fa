import { Router } from "express";

const controller = Router();

controller.post("/hello-detector", (req, res) => {
    res.json({});
});

export default controller;
