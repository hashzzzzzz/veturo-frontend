import Car from "../models/Car.js";

function getOptimizedCardImage(imageUrl = "") {
  if (!imageUrl || typeof imageUrl !== "string") return "";

  if (imageUrl.startsWith("data:image/")) {
    return "";
  }

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    return imageUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_700,h_450,c_fill/"
    );
  }

  return imageUrl;
}

function sanitizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.filter(
    (img) => typeof img === "string" && img.trim() && !img.startsWith("data:image/")
  );
}

export const createCar = async (req, res) => {
  try {
    const {
      title,
      brand,
      model,
      year,
      type,
      transmission,
      fuelType,
      seats,
      city,
      airport,
      deliveryAirports,
      location,
      description,
      dailyPrice,
      monthlyPrice,
      images,
      features,
      blockedDates,
      freeDates,
      isCityListing,
      isAirportListing,
      isMonthlyAvailable,
      hostPhone,
      hostAvatar,
      featuredSection,
      featuredSectionTitle,
      featuredSectionKey,
      isAvailable,
      isFeatured,
      isApproved,
      isPublished,
      approvalStatus,
      adminNotes,
    } = req.body;

    const cleanedImages = sanitizeImages(images);

    const car = await Car.create({
      owner: req.user._id,
      title,
      brand,
      model,
      year,
      type,
      transmission,
      fuelType,
      seats,
      city,
      airport,
      deliveryAirports,
      location,
      description,
      dailyPrice,
      monthlyPrice,
      images: cleanedImages,
      features,
      blockedDates,
      freeDates,
      isCityListing,
      isAirportListing,
      isMonthlyAvailable,
      hostPhone,
      hostAvatar:
        typeof hostAvatar === "string" && !hostAvatar.startsWith("data:image/")
          ? hostAvatar
          : "",
      featuredSection,
      featuredSectionTitle,
      featuredSectionKey,
      isAvailable,
      isFeatured,
      isApproved,
      isPublished,
      approvalStatus,
      adminNotes,
    });

    res.status(201).json(car);
  } catch (error) {
    console.error("Create car error:", error);
    res.status(500).json({ message: "Failed to create car" });
  }
};

export const getAllCars = async (req, res) => {
  try {
    const { city, airport, deliveryAirport, type } = req.query;

    const query = { isApproved: true, isAvailable: true };

    if (city) query.city = city;
    if (airport) query.airport = airport;
    if (type) query.type = type;
    if (deliveryAirport) query.deliveryAirports = deliveryAirport;

    const cars = await Car.find(query)
      .select(
        [
          "_id",
          "title",
          "year",
          "type",
          "transmission",
          "fuelType",
          "city",
          "airport",
          "isCityListing",
          "isAirportListing",
          "location",
          "dailyPrice",
          "monthlyPrice",
          "isMonthlyAvailable",
          "images",
          "rating",
          "trips",
          "blockedDates",
          "featuredSection",
          "featuredSectionTitle",
          "featuredSectionKey",
          "createdAt",
        ].join(" ")
      )
      .sort({ createdAt: -1 })
      .lean();

    const optimizedCars = cars.map((car) => {
      const firstImage =
        Array.isArray(car.images) && car.images.length > 0 ? car.images[0] : "";

      return {
        ...car,
        images: firstImage ? [getOptimizedCardImage(firstImage)] : [],
      };
    });

    res.json(optimizedCars);
  } catch (error) {
    console.error("Get cars error:", error);
    res.status(500).json({ message: "Failed to fetch cars" });
  }
};

export const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id).populate(
      "owner",
      "name email avatar"
    );

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(car);
  } catch (error) {
    console.error("Get car by id error:", error);
    res.status(500).json({ message: "Failed to fetch car" });
  }
};

export const getCarsByHost = async (req, res) => {
  try {
    const cars = await Car.find({
      owner: req.params.hostId,
      isApproved: true,
    }).populate("owner", "name email avatar");

    res.json(cars);
  } catch (error) {
    console.error("Get host cars error:", error);
    res.status(500).json({ message: "Failed to fetch host cars" });
  }
};