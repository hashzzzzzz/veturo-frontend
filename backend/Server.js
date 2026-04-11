import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import carRoutes from "./routes/carRoutes.js";

dotenv.config();

const app = express();

// ✅ DEBUG (remove later)
console.log("ENV CHECK:");
console.log("PORT:", process.env.PORT);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("MONGO_URL exists:", !!process.env.MONGO_URL);

// ✅ MIDDLEWARES
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// ✅ BIGGER BODY LIMIT FOR BASE64 IMAGES
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// ✅ TEST ROUTE
app.get("/", (req, res) => {
  res.send("Veturo API running...");
});

// ✅ ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/cars", carRoutes);

// ✅ PORT
const PORT = process.env.PORT || 5000;

// ✅ START SERVER ONLY AFTER DB
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🔥 Server running on http://localhost:${PORT}`);
  });
};

startServer();
