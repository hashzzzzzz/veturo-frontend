import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    const email = "admin@veturo.com";

    const existing = await User.findOne({ email });

    if (existing) {
      console.log("Superadmin already exists");
      process.exit(0);
    }

    const user = await User.create({
      name: "Super Admin",
      email: "admin@veturo.com",
      password: "123456",
      avatar: "",
      provider: "local",
      role: "superadmin",
      isVerified: true,
    });

    console.log("SUPERADMIN CREATED:");
    console.log({
      email: user.email,
      password: "123456",
      role: user.role,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating superadmin:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();