import express from "express";
import jwt from "jsonwebtoken";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";

import Car from "../models/Car.js";
import User from "../models/User.js";
import protect, { hostOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

const ADMIN_ROLES = ["admin", "superadmin"];

/* =========================
   CLOUDINARY + MULTER
========================= */
function getCloudinaryEnv() {
  return {
    cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME || ""}`.trim(),
    api_key: `${process.env.CLOUDINARY_API_KEY || ""}`.trim(),
    api_secret: `${process.env.CLOUDINARY_API_SECRET || ""}`.trim(),
  };
}

function ensureCloudinaryConfigured() {
  const creds = getCloudinaryEnv();

  if (!creds.cloud_name || !creds.api_key || !creds.api_secret) {
    const missing = [];
    if (!creds.cloud_name) missing.push("CLOUDINARY_CLOUD_NAME");
    if (!creds.api_key) missing.push("CLOUDINARY_API_KEY");
    if (!creds.api_secret) missing.push("CLOUDINARY_API_SECRET");

    throw new Error(
      `Cloudinary env vars missing or empty: ${missing.join(", ")}`
    );
  }

  cloudinary.config(creds);
  return creds;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 6,
  },
});

const uploadToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    ensureCloudinaryConfigured();

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "veturo/cars",
        resource_type: "image",
        transformation: [
          { width: 1600, height: 1200, crop: "limit" },
          { fetch_format: "auto", quality: "auto" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );

    streamifier.createReadStream(buffer).pipe(stream);
  });

/* =========================
   HELPERS
========================= */
function normalizeSectionKey(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeRegex(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isBase64Image(value = "") {
  return typeof value === "string" && value.startsWith("data:image/");
}

function optimizeCloudinaryCardImage(imageUrl = "") {
  if (!imageUrl || typeof imageUrl !== "string") return "";

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    return imageUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_700,h_450,c_fill/"
    );
  }

  return imageUrl;
}

function getDefaultSectionMeta(car) {
  const airportMap = {
    PRN: "Pristina Airport Rental",
    TIA: "Tirana Airport Rental",
    SKP: "Skopje Airport Rental",
  };

  if (car.isAirportListing && car.airport) {
    const title = airportMap[car.airport] || `${car.airport} Airport Rental`;
    return {
      featuredSectionTitle: title,
      featuredSectionKey: `airport-${normalizeSectionKey(car.airport)}`,
    };
  }

  if (car.isCityListing && car.city) {
    return {
      featuredSectionTitle: `${car.city} City Rental`,
      featuredSectionKey: `city-${normalizeSectionKey(car.city)}`,
    };
  }

  return {
    featuredSectionTitle: "Other Rentals",
    featuredSectionKey: "other-rentals",
  };
}

function canManageCar(user, car) {
  if (!user || !car) return false;
  if (ADMIN_ROLES.includes(user.role)) return true;
  return car.owner?.toString() === user._id?.toString();
}

async function protectOptional(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    req.user = user || null;

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return fallback;
}

function parseNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function sanitizeArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => `${item}`.trim()).filter(Boolean);
}

function sanitizeImageArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => `${item}`.trim())
    .filter(Boolean)
    .filter((item) => !isBase64Image(item));
}

function buildCarPayloadFromBody(body, options = {}) {
  const {
    existingImages = [],
    uploadedImages = [],
    keepExistingImages = true,
  } = options;

  const parsedFeatures = parseJsonField(body.features, {});
  const parsedBlockedDates = parseJsonField(body.blockedDates, []);
  const parsedFreeDates = parseJsonField(body.freeDates, []);
  const parsedDeliveryAirports = parseJsonField(body.deliveryAirports, []);

  const isCityListing = parseBoolean(body.isCityListing, false);
  const isAirportListing = parseBoolean(body.isAirportListing, false);
  const isMonthlyAvailable = parseBoolean(body.isMonthlyAvailable, false);
  const isAvailable = parseBoolean(body.isAvailable, true);
  const isFeatured = parseBoolean(body.isFeatured, false);
  const isPublished = parseBoolean(body.isPublished, false);

  const bodyImages = sanitizeImageArray(parseJsonField(body.existingImages, []));
  const mergedExistingImages = keepExistingImages
    ? bodyImages.length > 0
      ? bodyImages
      : sanitizeImageArray(existingImages)
    : [];

  return {
    title: `${body.title || ""}`.trim(),
    brand: `${body.brand || ""}`.trim(),
    model: `${body.model || ""}`.trim(),
    year: parseNumber(body.year, 0),
    type: `${body.type || ""}`.trim(),
    transmission: `${body.transmission || ""}`.trim(),
    fuelType: `${body.fuelType || ""}`.trim(),
    seats: parseNumber(body.seats, 0),

    isCityListing,
    city: isCityListing ? `${body.city || ""}`.trim() : "",

    isAirportListing,
    airport: isAirportListing ? `${body.airport || ""}`.trim() : null,

    deliveryAirports: sanitizeArray(parsedDeliveryAirports),

    location: `${body.location || ""}`.trim(),
    googleMapsUrl: `${body.googleMapsUrl || ""}`.trim(),
    description: `${body.description || ""}`.trim(),

    dailyPrice: parseNumber(body.dailyPrice, 0),

    isMonthlyAvailable,
    monthlyPrice: isMonthlyAvailable ? parseNumber(body.monthlyPrice, 0) : 0,

    images: [...mergedExistingImages, ...uploadedImages].slice(0, 6),

    hostPhone: `${body.hostPhone || ""}`.trim(),
    hostAvatar: "",

    features: {
      safety: sanitizeArray(parsedFeatures?.safety),
      tech: sanitizeArray(parsedFeatures?.tech),
      convenience: sanitizeArray(parsedFeatures?.convenience),
      defects: sanitizeArray(parsedFeatures?.defects),
    },

    blockedDates: sanitizeArray(parsedBlockedDates),
    freeDates: sanitizeArray(parsedFreeDates),

    rating: parseNumber(body.rating, 0),
    trips: parseNumber(body.trips, 0),

    isAvailable,
    isFeatured,
    isPublished,

    featuredSection: `${body.featuredSection || ""}`.trim(),
    featuredSectionTitle: `${body.featuredSectionTitle || ""}`.trim(),
    featuredSectionKey: `${body.featuredSectionKey || ""}`.trim(),
    adminNotes: `${body.adminNotes || ""}`.trim(),
  };
}

async function uploadFilesToCloudinary(files = []) {
  const uploadedImages = [];

  for (const file of files) {
    const url = await uploadToCloudinary(file.buffer);
    uploadedImages.push(url);
  }

  return uploadedImages;
}

async function getSafeHostMeta(userId, fallbackPhone = "") {
  const hostUser = await User.findById(userId).select("phone avatar");

  return {
    hostPhone: `${fallbackPhone || hostUser?.phone || ""}`.trim(),
    hostAvatar:
      hostUser?.avatar &&
      typeof hostUser.avatar === "string" &&
      !isBase64Image(hostUser.avatar)
        ? hostUser.avatar
        : "",
  };
}

/**
 * GET ALL CARS
 */
router.get("/", protectOptional, async (req, res) => {
  try {
    const {
      city,
      airport,
      deliveryAirport,
      type,
      owner,
      approvalStatus,
      featuredSectionTitle,
      includeAll,
      search,
    } = req.query;

    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const query = {};

    if (!isAdmin || includeAll !== "true") {
      query.approvalStatus = "approved";
      query.isPublished = true;
    }

    if (approvalStatus && isAdmin) {
      query.approvalStatus = approvalStatus;
    }

    if (city) query.city = new RegExp(`^${escapeRegex(city)}$`, "i");
    if (airport) query.airport = airport;
    if (type) query.type = new RegExp(`^${escapeRegex(type)}$`, "i");
    if (owner) query.owner = owner;

    if (featuredSectionTitle) {
      query.featuredSectionTitle = new RegExp(
        `^${escapeRegex(featuredSectionTitle)}$`,
        "i"
      );
    }

    if (deliveryAirport) {
      query.deliveryAirports = deliveryAirport;
    }

    if (search) {
      query.$or = [
        { city: new RegExp(escapeRegex(search), "i") },
        { airport: new RegExp(escapeRegex(search), "i") },
        { location: new RegExp(escapeRegex(search), "i") },
        { title: new RegExp(escapeRegex(search), "i") },
        { featuredSectionTitle: new RegExp(escapeRegex(search), "i") },
      ];
    }

    const cars = await Car.find(query)
      .select(
        [
          "title",
          "brand",
          "model",
          "year",
          "type",
          "transmission",
          "fuelType",
          "seats",
          "city",
          "airport",
          "location",
          "dailyPrice",
          "monthlyPrice",
          "isMonthlyAvailable",
          "rating",
          "trips",
          "images",
          "isCityListing",
          "isAirportListing",
          "featuredSection",
          "featuredSectionTitle",
          "featuredSectionKey",
          "approvalStatus",
          "isPublished",
          "isAvailable",
          "createdAt",
          "blockedDates",
        ].join(" ")
      )
      .sort({ createdAt: -1 })
      .lean();

    const lightweightCars = cars.map((car) => {
      const firstImage =
        Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : "";

      return {
        ...car,
        images: firstImage ? [optimizeCloudinaryCardImage(firstImage)] : [],
      };
    });

    res.status(200).json(lightweightCars);
  } catch (error) {
    console.error("GET /api/cars ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch cars",
    });
  }
});

/**
 * SEARCH OPTIONS FOR HERO SEARCH
 */
router.get("/search/options", async (req, res) => {
  try {
    const rawTerm = `${req.query.q || ""}`.trim();

    const cars = await Car.find({
      approvalStatus: "approved",
      isPublished: true,
    })
      .select(
        "city airport isCityListing isAirportListing blockedDates featuredSectionTitle featuredSectionKey"
      )
      .lean();

    const airportMap = {
      PRN: {
        title: "Pristina Airport",
        subtitle: "Pristina International Airport (PRN)",
        type: "airport",
      },
      TIA: {
        title: "Tirana Airport",
        subtitle: "Tirana International Airport (TIA)",
        type: "airport",
      },
      SKP: {
        title: "Skopje Airport",
        subtitle: "Skopje International Airport (SKP)",
        type: "airport",
      },
    };

    const suggestionMap = new Map();

    for (const car of cars) {
      if (car.isCityListing && car.city) {
        const key = `city-${normalizeSectionKey(car.city)}`;
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            id: key,
            type: "city",
            label: car.city,
            title: `${car.city} City`,
            subtitle: `See cars in ${car.city}`,
            value: car.city,
            targetSectionKey: car.featuredSectionKey || key,
          });
        }
      }

      if (car.isAirportListing && car.airport) {
        const airportInfo = airportMap[car.airport] || {
          title: `${car.airport} Airport`,
          subtitle: `${car.airport} airport rentals`,
          type: "airport",
        };

        const key = `airport-${normalizeSectionKey(car.airport)}`;
        if (!suggestionMap.has(key)) {
          suggestionMap.set(key, {
            id: key,
            type: airportInfo.type,
            label: airportInfo.title,
            title: airportInfo.title,
            subtitle: airportInfo.subtitle,
            value: car.airport,
            airportCode: car.airport,
            targetSectionKey: car.featuredSectionKey || key,
          });
        }
      }
    }

    let suggestions = Array.from(suggestionMap.values());

    if (rawTerm) {
      const term = rawTerm.toLowerCase();
      suggestions = suggestions.filter((item) =>
        [item.label, item.title, item.subtitle, item.value, item.airportCode]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term))
      );
    }

    suggestions.sort((a, b) => a.title.localeCompare(b.title));

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("GET /api/cars/search/options ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch search options",
    });
  }
});

/**
 * GET ALL CARS BY HOST
 */
router.get("/host/:hostId", protect, async (req, res) => {
  try {
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const requestedHostId = req.params.hostId;

    if (!isAdmin && req.user?._id?.toString() !== requestedHostId) {
      return res
        .status(403)
        .json({ message: "You are not allowed to view these cars" });
    }

    const cars = await Car.find({ owner: requestedHostId })
      .populate("owner", "name email avatar role")
      .sort({ createdAt: -1 });

    res.status(200).json(cars);
  } catch (error) {
    console.error("GET /api/cars/host/:hostId ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch host cars",
    });
  }
});

/**
 * ADMIN REVIEW QUEUE
 */
router.get("/admin/review", protect, async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res
        .status(403)
        .json({ message: "Only admin or superadmin can access review cars" });
    }

    const cars = await Car.find({
      approvalStatus: { $in: ["pending", "changes_requested"] },
    })
      .populate("owner", "name email avatar role")
      .sort({ updatedAt: -1, createdAt: -1 });

    res.status(200).json(cars);
  } catch (error) {
    console.error("GET /api/cars/admin/review ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch review cars",
    });
  }
});

/**
 * GET SINGLE CAR BY ID
 */
router.get("/:id", protectOptional, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      "owner",
      "name email avatar role"
    );

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const isOwner = req.user?._id?.toString() === car.owner?._id?.toString();

    if (car.approvalStatus !== "approved" || !car.isPublished) {
      if (!isAdmin && !isOwner) {
        return res.status(404).json({ message: "Car not found" });
      }
    }

    res.status(200).json(car);
  } catch (error) {
    console.error("GET /api/cars/:id ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to fetch car",
    });
  }
});

/**
 * CREATE NEW CAR
 */
router.post("/", protect, hostOnly, upload.array("images", 6), async (req, res) => {
  try {
    const cloudinaryEnv = getCloudinaryEnv();

    console.log("POST /api/cars BODY:", req.body);
    console.log("POST /api/cars FILES:", req.files?.length || 0);
    console.log("Cloudinary configured:", {
      cloud_name: !!cloudinaryEnv.cloud_name,
      api_key: !!cloudinaryEnv.api_key,
      api_secret: !!cloudinaryEnv.api_secret,
    });

    if (
      !cloudinaryEnv.cloud_name ||
      !cloudinaryEnv.api_key ||
      !cloudinaryEnv.api_secret
    ) {
      return res.status(400).json({
        message: "Cloudinary env vars are missing in backend .env",
      });
    }

    const uploadedImages = await uploadFilesToCloudinary(req.files || []);
    const parsedBody = buildCarPayloadFromBody(req.body, {
      existingImages: [],
      uploadedImages,
      keepExistingImages: false,
    });

    if (!parsedBody.title) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!parsedBody.brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    if (!parsedBody.model) {
      return res.status(400).json({ message: "Model is required" });
    }

    if (!parsedBody.year || parsedBody.year < 1900) {
      return res.status(400).json({ message: "Valid year is required" });
    }

    if (!parsedBody.type) {
      return res.status(400).json({ message: "Type is required" });
    }

    if (!parsedBody.transmission) {
      return res.status(400).json({ message: "Transmission is required" });
    }

    if (!parsedBody.fuelType) {
      return res.status(400).json({ message: "Fuel type is required" });
    }

    if (!parsedBody.seats || parsedBody.seats <= 0) {
      return res.status(400).json({ message: "Valid seats are required" });
    }

    if (!parsedBody.location) {
      return res.status(400).json({ message: "Location is required" });
    }

    if (!parsedBody.description) {
      return res.status(400).json({ message: "Description is required" });
    }

    if (!parsedBody.dailyPrice || parsedBody.dailyPrice <= 0) {
      return res.status(400).json({ message: "Valid daily price is required" });
    }

    if (!parsedBody.isCityListing && !parsedBody.isAirportListing) {
      return res.status(400).json({ message: "Choose city or airport listing" });
    }

    if (parsedBody.isCityListing && !parsedBody.city) {
      return res.status(400).json({ message: "City is required" });
    }

    if (parsedBody.isAirportListing && !parsedBody.airport) {
      return res.status(400).json({ message: "Airport is required" });
    }

    if (!parsedBody.images || parsedBody.images.length < 3) {
      return res.status(400).json({
        message: "Please upload at least 3 photos",
      });
    }

    const hostMeta = await getSafeHostMeta(req.user._id, parsedBody.hostPhone);
    const defaultSection = getDefaultSectionMeta(parsedBody);
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);

    const payload = {
      ...parsedBody,
      owner: req.user._id,
      hostPhone: hostMeta.hostPhone,
      hostAvatar: hostMeta.hostAvatar,
      featuredSectionTitle:
        typeof req.body.featuredSectionTitle === "string" &&
        req.body.featuredSectionTitle.trim()
          ? req.body.featuredSectionTitle.trim()
          : defaultSection.featuredSectionTitle,
      featuredSectionKey:
        typeof req.body.featuredSectionKey === "string" &&
        req.body.featuredSectionKey.trim()
          ? normalizeSectionKey(req.body.featuredSectionKey)
          : defaultSection.featuredSectionKey,
      approvalStatus: isAdmin ? "approved" : "pending",
      isPublished: isAdmin,
      adminNotes: req.body.adminNotes || "",
      lastSubmittedAt: new Date(),
      publishedAt: isAdmin ? new Date() : null,
    };

    const newCar = new Car(payload);
    const savedCar = await newCar.save();

    const populatedCar = await Car.findById(savedCar._id).populate(
      "owner",
      "name email avatar role"
    );

    res.status(201).json(populatedCar);
  } catch (error) {
    console.error("POST /api/cars ERROR:", error);
    res.status(400).json({
      message: error.message || "Failed to create car",
    });
  }
});

/**
 * UPDATE CAR
 */
router.put("/:id", protect, hostOnly, upload.array("images", 6), async (req, res) => {
  try {
    const existingCar = await Car.findById(req.params.id);

    if (!existingCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    if (!canManageCar(req.user, existingCar)) {
      return res.status(403).json({
        message: "You can only update your own cars",
      });
    }

    const uploadedImages = await uploadFilesToCloudinary(req.files || []);
    const parsedBody = buildCarPayloadFromBody(req.body, {
      existingImages: existingCar.images || [],
      uploadedImages,
      keepExistingImages: true,
    });

    if (!parsedBody.images || parsedBody.images.length < 3) {
      return res.status(400).json({
        message: "Please keep at least 3 photos",
      });
    }

    const hostMeta = await getSafeHostMeta(req.user._id, parsedBody.hostPhone);
    const isAdmin = ADMIN_ROLES.includes(req.user?.role);
    const defaultSection = getDefaultSectionMeta(parsedBody);

    const updateData = {
      ...parsedBody,
      hostPhone: hostMeta.hostPhone,
      hostAvatar: hostMeta.hostAvatar,
      featuredSectionTitle:
        typeof req.body.featuredSectionTitle === "string" &&
        req.body.featuredSectionTitle.trim()
          ? req.body.featuredSectionTitle.trim()
          : defaultSection.featuredSectionTitle,
      featuredSectionKey:
        typeof req.body.featuredSectionKey === "string" &&
        req.body.featuredSectionKey.trim()
          ? normalizeSectionKey(req.body.featuredSectionKey)
          : defaultSection.featuredSectionKey,
      lastSubmittedAt: new Date(),
    };

    if (isAdmin) {
      if (req.body.approvalStatus) {
        updateData.approvalStatus = req.body.approvalStatus;
      }
      if (typeof req.body.isPublished !== "undefined") {
        updateData.isPublished = parseBoolean(
          req.body.isPublished,
          existingCar.isPublished
        );
      }
      if (updateData.approvalStatus === "approved" && updateData.isPublished) {
        updateData.publishedAt = existingCar.publishedAt || new Date();
      }
    } else {
      updateData.approvalStatus = "pending";
      updateData.isPublished = false;
      updateData.publishedAt = null;
    }

    const updatedCar = await Car.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("owner", "name email avatar role");

    res.status(200).json(updatedCar);
  } catch (error) {
    console.error("PUT /api/cars/:id ERROR:", error);
    res.status(400).json({
      message: error.message || "Failed to update car",
    });
  }
});

/**
 * ADMIN REVIEW ACTIONS
 */
router.put("/:id/review", protect, async (req, res) => {
  try {
    if (!ADMIN_ROLES.includes(req.user?.role)) {
      return res
        .status(403)
        .json({ message: "Only admin or superadmin can review cars" });
    }

    const existingCar = await Car.findById(req.params.id);

    if (!existingCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    const {
      action,
      adminNotes = "",
      featuredSectionTitle,
      featuredSectionKey,
      ...editableFields
    } = req.body;

    const updateData = {
      ...editableFields,
      adminNotes,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    };

    const computedSection = getDefaultSectionMeta({
      ...existingCar.toObject(),
      ...editableFields,
    });

    updateData.featuredSectionTitle =
      typeof featuredSectionTitle === "string" && featuredSectionTitle.trim()
        ? featuredSectionTitle.trim()
        : existingCar.featuredSectionTitle || computedSection.featuredSectionTitle;

    updateData.featuredSectionKey =
      typeof featuredSectionKey === "string" && featuredSectionKey.trim()
        ? normalizeSectionKey(featuredSectionKey)
        : existingCar.featuredSectionKey || computedSection.featuredSectionKey;

    if (action === "approve") {
      updateData.approvalStatus = "approved";
      updateData.isPublished = true;
      updateData.publishedAt = existingCar.publishedAt || new Date();
    } else if (action === "changes_requested") {
      updateData.approvalStatus = "changes_requested";
      updateData.isPublished = false;
      updateData.publishedAt = null;
    } else if (action === "reject") {
      updateData.approvalStatus = "rejected";
      updateData.isPublished = false;
      updateData.publishedAt = null;
    } else {
      return res.status(400).json({ message: "Invalid review action" });
    }

    const updatedCar = await Car.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("owner", "name email avatar role");

    res.status(200).json(updatedCar);
  } catch (error) {
    console.error("PUT /api/cars/:id/review ERROR:", error);
    res.status(400).json({
      message: error.message || "Failed to review car",
    });
  }
});

/**
 * DELETE CAR
 */
router.delete("/:id", protect, hostOnly, async (req, res) => {
  try {
    const existingCar = await Car.findById(req.params.id);

    if (!existingCar) {
      return res.status(404).json({ message: "Car not found" });
    }

    if (!canManageCar(req.user, existingCar)) {
      return res.status(403).json({
        message: "You can only delete your own cars",
      });
    }

    await Car.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/cars/:id ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to delete car",
    });
  }
});

export default router;