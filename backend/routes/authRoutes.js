import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";
import Car from "../models/Car.js";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import { googleAuth } from "../controllers/authController.js";
import {
  getEmailVerificationUrl,
  getPasswordResetUrl,
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../utils/verificationEmail.js";

const router = express.Router();
const VERIFICATION_TOKEN_EXPIRES_MS = 30 * 60 * 1000;

const signToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const hashVerificationToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const hashPasswordResetToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createVerificationToken = () => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_EXPIRES_MS),
  };
};

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

router.post("/google", googleAuth);

router.post("/forgot-password", async (req, res) => {
  try {
    const email = `${req.body.email || ""}`.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = await User.findOne({ email });
    const response = {
      message:
        "If that email exists, we sent a password reset link. Check your inbox.",
    };

    if (!user) {
      return res.status(200).json(response);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetToken = hashPasswordResetToken(rawToken);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = getPasswordResetUrl(rawToken);
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    if (!emailResult.sent) {
      response.resetUrl = resetUrl;
      response.message =
        "Email sending is not configured yet, so use the dev password reset link.";
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("forgot-password error:", error);
    return res.status(500).json({
      message: error.message || "Failed to send password reset email",
    });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const password = `${req.body.password || ""}`.trim();

    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const tokenHash = hashPasswordResetToken(req.params.token);
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "This password reset link is invalid or expired.",
      });
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.isVerified = true;

    await user.save();

    return res.status(200).json({
      message: "Password updated. You can log in now.",
    });
  } catch (error) {
    console.error("reset-password error:", error);
    return res.status(500).json({
      message: error.message || "Failed to reset password",
    });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const name = `${req.body.name || ""}`.trim();
    const email = `${req.body.email || ""}`.trim().toLowerCase();
    const password = `${req.body.password || ""}`.trim();

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isVerified !== false) {
      return res.status(400).json({
        message:
          existingUser.provider === "google" && !existingUser.password
            ? "An account with this email already exists. Continue with Google."
            : "An account with this email already exists. Please log in.",
      });
    }

    const { rawToken, tokenHash, expiresAt } = createVerificationToken();

    const user =
      existingUser ||
      new User({
        role: "user",
        provider: "local",
        avatar: "",
      });

    user.name = name;
    user.email = email;
    user.password = password;
    user.provider = "local";
    user.isVerified = false;
    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    const verifyUrl = getEmailVerificationUrl(rawToken);
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
    });

    const response = {
      message:
        existingUser && existingUser.googleId
          ? emailResult.sent
            ? "We sent a 30-minute verification email. After you verify it, you can log in with your password too."
            : "Your account already exists and email sending is not configured yet, so use the dev verification link."
          : existingUser && existingUser.isVerified === false
          ? emailResult.sent
            ? "We sent a fresh 30-minute verification email to finish your Veturo signup."
            : "Your account is still waiting for verification. Email sending is not configured yet, so use the dev verification link."
          : emailResult.sent
          ? "Check your email to verify your Veturo account. This link expires in 30 minutes."
          : "Account created. Email sending is not configured yet, so use the dev verification link.",
    };

    if (!emailResult.sent) {
      response.verificationUrl = verifyUrl;
    }

    return res.status(201).json(response);
  } catch (error) {
    console.error("signup error:", error);
    return res.status(500).json({
      message: error.message || "Failed to create account",
    });
  }
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const token = `${req.params.token || ""}`.trim();

    if (!token || token.length < 32) {
      return res.status(400).json({
        message: "This verification link is invalid or expired.",
      });
    }

    const tokenHash = hashVerificationToken(req.params.token);

    const user = await User.findOne({
      emailVerificationToken: tokenHash,
    });

    if (!user) {
      return res.status(400).json({
        message: "This verification link is invalid or expired.",
      });
    }

    if (user.isVerified) {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      return res.status(200).json({
        message: "Your email is already verified. You can log in.",
      });
    }

    if (!user.emailVerificationExpires || user.emailVerificationExpires <= new Date()) {
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();

      return res.status(400).json({
        message: "This verification link expired. Request a fresh verification email.",
      });
    }

    user.isVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      message: "Email verified successfully. You can log in now.",
    });
  } catch (error) {
    console.error("verify-email error:", error);
    return res.status(500).json({ message: "Failed to verify email." });
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const email = `${req.body.email || ""}`.trim().toLowerCase();

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(200).json({
        message:
          "If that account needs verification, we sent a fresh verification email.",
      });
    }

    if (user.isVerified !== false) {
      return res.status(200).json({
        message: "This account is already verified. You can log in.",
      });
    }

    if (user.provider === "google" && !user.password) {
      return res.status(200).json({
        message: "This account uses Google sign-in. Continue with Google.",
      });
    }

    const { rawToken, tokenHash, expiresAt } = createVerificationToken();

    user.emailVerificationToken = tokenHash;
    user.emailVerificationExpires = expiresAt;
    await user.save();

    const verifyUrl = getEmailVerificationUrl(rawToken);
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verifyUrl,
    });

    const response = {
      message: emailResult.sent
        ? "We sent a fresh verification link. Check your email before logging in."
        : "Email sending is not configured yet, so use the dev verification link.",
    };

    if (!emailResult.sent) {
      response.verificationUrl = verifyUrl;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("resend-verification error:", error);
    return res.status(500).json({
      message: "Failed to resend verification email.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = `${req.body.email || ""}`.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          user.provider === "google"
            ? "This account uses Google sign-in. Continue with Google."
            : "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (user.provider !== "google" && user.isVerified === false) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    res.status(200).json({
      token: signToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/create-host", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required" });
    }

    const existingUser = await User.findOne({
      email: email.trim().toLowerCase(),
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    const host = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      avatar: avatar || "",
      provider: "local",
      role: "host",
      isVerified: true,
    });

    res.status(201).json({
      message: "Host created successfully",
      host: {
        _id: host._id,
        name: host.name,
        email: host.email,
        avatar: host.avatar,
        role: host.role,
        provider: host.provider,
        isVerified: host.isVerified,
        createdAt: host.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// SEE ALL HOSTS
router.get("/hosts", protect, adminOnly, async (req, res) => {
  try {
    const hosts = await User.find({ role: "host" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// EDIT HOST NAME / EMAIL / AVATAR / ROLE
router.put("/hosts/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatar, role, isVerified } = req.body;

    const host = await User.findById(id);

    if (!host) {
      return res.status(404).json({ message: "Host not found" });
    }

    if (email && email.trim().toLowerCase() !== host.email) {
      const existingEmail = await User.findOne({
        email: email.trim().toLowerCase(),
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    host.name = name?.trim() || host.name;
    host.email = email?.trim()?.toLowerCase() || host.email;
    host.avatar = avatar !== undefined ? avatar : host.avatar;

    if (role && ["user", "host", "admin", "superadmin"].includes(role)) {
      host.role = role;
    }

    if (typeof isVerified === "boolean") {
      host.isVerified = isVerified;
    }

    await host.save();

    res.status(200).json({
      message: "Host updated successfully",
      host: {
        _id: host._id,
        name: host.name,
        email: host.email,
        avatar: host.avatar,
        role: host.role,
        provider: host.provider,
        isVerified: host.isVerified,
        createdAt: host.createdAt,
        updatedAt: host.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// CHANGE HOST PASSWORD
router.put("/hosts/:id/password", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({
        message: "New password must be at least 6 characters",
      });
    }

    const host = await User.findById(id);

    if (!host) {
      return res.status(404).json({ message: "Host not found" });
    }

    host.password = newPassword.trim();
    host.provider = "local";

    await host.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/hosts/:id", protect, adminOnly, async (req, res) => {
  try {
    const { id } = req.params;

    const host = await User.findById(id);

    if (!host) {
      return res.status(404).json({ message: "Host not found" });
    }

    const deletedCars = await Car.deleteMany({ owner: host._id });
    await host.deleteOne();

    res.status(200).json({
      message: "Host deleted successfully",
      deletedCarsCount: deletedCars.deletedCount || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to delete host" });
  }
});

export default router;
