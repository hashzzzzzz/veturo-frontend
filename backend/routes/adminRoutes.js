import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import {
  createHost,
  getHosts,
  updateHost,
  deleteHost,
  updateHostPassword,
} from "../controllers/adminController.js";

const router = express.Router();

router.post("/hosts", protect, adminOnly, createHost);
router.get("/hosts", protect, adminOnly, getHosts);
router.put("/hosts/:id", protect, adminOnly, updateHost);
router.delete("/hosts/:id", protect, adminOnly, deleteHost);
router.put("/hosts/:id/password", protect, adminOnly, updateHostPassword);

export default router;