import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const googleClient = new OAuth2Client();

const getGoogleClientIds = () => {
  return [process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_IDS]
    .filter(Boolean)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
};

const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

export const googleAuth = async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required.",
      });
    }

    const googleClientIds = getGoogleClientIds();

    if (!googleClientIds.length) {
      return res.status(500).json({
        success: false,
        message: "Google authentication is not configured.",
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: googleClientIds,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: "Invalid Google token payload.",
      });
    }

    const { sub, email, name, picture } = payload;
    const normalizedEmail = `${email || ""}`.trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Google account email not available.",
      });
    }

    let user = await User.findOne({
      $or: [{ googleId: sub }, { email: normalizedEmail }],
    });

    if (!user) {
      user = await User.create({
        name: name || "",
        email: normalizedEmail,
        googleId: sub,
        avatar: picture || "",
        provider: "google",
        isVerified: true,
        verifiedAt: new Date(),
      });
    } else {
      user.googleId = user.googleId || sub;
      user.name = user.name || name || "";
      user.avatar = picture || user.avatar;
      user.provider = "google";
      user.isVerified = true;
      user.verifiedAt = user.verifiedAt || new Date();
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google login successful.",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("googleAuth error:", error);

    return res.status(500).json({
      success: false,
      message: "Google authentication failed.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("getMe error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user.",
    });
  }
};
