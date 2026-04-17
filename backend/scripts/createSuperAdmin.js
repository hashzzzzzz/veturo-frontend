import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const SUPERADMIN_EMAIL = "veturocar@gmail.com";

const createSuperAdmin = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is required");
    }

    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected");

    const user = await User.findOne({ email: SUPERADMIN_EMAIL });

    const superadmin =
      user ||
      new User({
        name: "Veturo Admin",
        email: SUPERADMIN_EMAIL,
        password: null,
        avatar: "",
        provider: "google",
      });

    superadmin.role = "superadmin";
    superadmin.isVerified = true;
    superadmin.verifiedAt = superadmin.verifiedAt || new Date();
    superadmin.emailVerificationToken = null;
    superadmin.emailVerificationExpires = null;

    await superadmin.save();

    console.log("SUPERADMIN UPDATED:");
    console.log({
      email: superadmin.email,
      role: superadmin.role,
      provider: superadmin.provider,
      isVerified: superadmin.isVerified,
      created: !user,
    });

    process.exit(0);
  } catch (error) {
    console.error("Error updating superadmin:", error.message);
    process.exit(1);
  }
};

createSuperAdmin();
