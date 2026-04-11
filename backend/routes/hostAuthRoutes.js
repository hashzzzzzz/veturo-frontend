import express from "express";
import { hostLogin } from "../controllers/hostAuthController.js";

const router = express.Router();

router.post("/login", hostLogin);

export default router;