import User from "../models/User.js";
import Car from "../models/Car.js";

export const createHost = async (req, res) => {
  try {
    const { name, email, password, avatar } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    const host = await User.create({
      name: name.trim(),
      email: normalizedEmail,
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
    res.status(500).json({
      message: "Failed to create host",
      error: error.message,
    });
  }
};

export const getHosts = async (req, res) => {
  try {
    const hosts = await User.find({ role: "host" })
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(hosts);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch hosts",
      error: error.message,
    });
  }
};

export const updateHost = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, avatar, role, isVerified } = req.body;

    const host = await User.findById(id);

    if (!host) {
      return res.status(404).json({
        message: "Host not found",
      });
    }

    const nextEmail = email?.trim()?.toLowerCase();

    if (nextEmail && nextEmail !== host.email) {
      const existingEmail = await User.findOne({
        email: nextEmail,
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(400).json({
          message: "Email already in use",
        });
      }
    }

    host.name = name?.trim() || host.name;
    host.email = nextEmail || host.email;
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
    res.status(500).json({
      message: "Failed to update host",
      error: error.message,
    });
  }
};

export const deleteHost = async (req, res) => {
  try {
    const { id } = req.params;

    const host = await User.findById(id);

    if (!host) {
      return res.status(404).json({
        message: "Host not found",
      });
    }

    const deletedCars = await Car.deleteMany({ owner: host._id });
    await host.deleteOne();

    res.status(200).json({
      message: "Host deleted successfully",
      deletedCarsCount: deletedCars.deletedCount || 0,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete host",
      error: error.message,
    });
  }
};

export const updateHostPassword = async (req, res) => {
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
      return res.status(404).json({
        message: "Host not found",
      });
    }

    host.password = newPassword.trim();
    host.provider = "local";

    await host.save();

    res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update password",
      error: error.message,
    });
  }
};
