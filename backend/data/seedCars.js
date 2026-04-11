import mongoose from "mongoose";
import dotenv from "dotenv";
import Car from "../models/Car.js";

dotenv.config();

const cars = [
  {
    title: "Jeep Compass",
    brand: "Jeep",
    model: "Compass",
    year: 2024,
    type: "SUV",
    city: "Pristina",
    airport: "PRN",
    pricePerDay: 160,
    rating: 4.97,
    trips: 128,
    transmission: "Automatic",
    fuelType: "Diesel",
    seats: 5,
    description:
      "Clean and comfortable SUV with airport delivery, heated seats, and excellent fuel economy.",
    features: [
      "Bluetooth",
      "Backup camera",
      "Apple CarPlay",
      "Heated seats",
      "USB charger"
    ],
    images: [
      "https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1200",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1200"
    ],
    savePercent: 8,
    badge: "Top rated",
    host: {
      name: "Arben",
      profileImage: "https://randomuser.me/api/portraits/men/32.jpg",
      joinedYear: 2024
    },
    location: {
      address: "Pristina International Airport",
      lat: 42.5728,
      lng: 21.0358
    },
    unavailableDates: ["2026-03-25", "2026-03-26"],
    isAvailable: true
  },
  {
    title: "Nissan Rogue",
    brand: "Nissan",
    model: "Rogue",
    year: 2025,
    type: "SUV",
    city: "Tirana",
    airport: "TIA",
    pricePerDay: 158,
    rating: 5.0,
    trips: 51,
    transmission: "Automatic",
    fuelType: "Petrol",
    seats: 5,
    description:
      "Modern SUV ideal for city drives and family trips with smooth automatic transmission.",
    features: [
      "Cruise control",
      "Bluetooth",
      "Parking sensors",
      "Apple CarPlay"
    ],
    images: [
      "https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=1200",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200",
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1200"
    ],
    savePercent: 8,
    badge: "Rare find",
    host: {
      name: "Besnik",
      profileImage: "https://randomuser.me/api/portraits/men/45.jpg",
      joinedYear: 2023
    },
    location: {
      address: "Tirana International Airport",
      lat: 41.4147,
      lng: 19.7206
    },
    unavailableDates: [],
    isAvailable: true
  },
  {
    title: "Volkswagen Golf 8",
    brand: "Volkswagen",
    model: "Golf 8",
    year: 2023,
    type: "Hatchback",
    city: "Pristina",
    airport: "PRN",
    pricePerDay: 88,
    rating: 4.91,
    trips: 76,
    transmission: "Automatic",
    fuelType: "Diesel",
    seats: 5,
    description:
      "Efficient and stylish hatchback, perfect for urban travel and weekend escapes.",
    features: [
      "Bluetooth",
      "Lane assist",
      "Digital cockpit",
      "USB-C",
      "Parking camera"
    ],
    images: [
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=1200",
      "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1200",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200"
    ],
    savePercent: 5,
    badge: "Popular",
    host: {
      name: "Luan",
      profileImage: "https://randomuser.me/api/portraits/men/50.jpg",
      joinedYear: 2025
    },
    location: {
      address: "Pristina Center",
      lat: 42.6629,
      lng: 21.1655
    },
    unavailableDates: ["2026-03-29"],
    isAvailable: true
  },
  {
    title: "Mercedes-Benz C-Class",
    brand: "Mercedes-Benz",
    model: "C-Class",
    year: 2022,
    type: "Sedan",
    city: "Skopje",
    airport: "SKP",
    pricePerDay: 145,
    rating: 4.95,
    trips: 39,
    transmission: "Automatic",
    fuelType: "Diesel",
    seats: 5,
    description:
      "Premium sedan with elegant interior and smooth ride quality for business or leisure.",
    features: [
      "Leather seats",
      "Apple CarPlay",
      "Ambient lighting",
      "Parking sensors"
    ],
    images: [
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?q=80&w=1200",
      "https://images.unsplash.com/photo-1502161254066-6c74afbf07aa?q=80&w=1200",
      "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1200"
    ],
    savePercent: 10,
    badge: "Premium",
    host: {
      name: "Valon",
      profileImage: "https://randomuser.me/api/portraits/men/61.jpg",
      joinedYear: 2022
    },
    location: {
      address: "Skopje International Airport",
      lat: 41.9616,
      lng: 21.6214
    },
    unavailableDates: [],
    isAvailable: true
  },
  {
    title: "BMW X5",
    brand: "BMW",
    model: "X5",
    year: 2024,
    type: "SUV",
    city: "Tirana",
    airport: "TIA",
    pricePerDay: 220,
    rating: 4.99,
    trips: 22,
    transmission: "Automatic",
    fuelType: "Diesel",
    seats: 5,
    description:
      "Luxury SUV with powerful performance, spacious interior, and premium features.",
    features: [
      "360 camera",
      "Leather seats",
      "Panoramic roof",
      "Navigation",
      "Apple CarPlay"
    ],
    images: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?q=80&w=1200",
      "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1200",
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1200"
    ],
    savePercent: 6,
    badge: "Luxury",
    host: {
      name: "Gent",
      profileImage: "https://randomuser.me/api/portraits/men/25.jpg",
      joinedYear: 2021
    },
    location: {
      address: "Tirana Downtown",
      lat: 41.3275,
      lng: 19.8187
    },
    unavailableDates: ["2026-04-01", "2026-04-02"],
    isAvailable: true
  },
  {
    title: "Hyundai Tucson",
    brand: "Hyundai",
    model: "Tucson",
    year: 2024,
    type: "SUV",
    city: "Pristina",
    airport: "PRN",
    pricePerDay: 118,
    rating: 4.89,
    trips: 64,
    transmission: "Automatic",
    fuelType: "Petrol",
    seats: 5,
    description:
      "Reliable SUV with modern tech and a comfortable cabin for road trips or daily use.",
    features: [
      "Android Auto",
      "Apple CarPlay",
      "Parking camera",
      "Keyless entry"
    ],
    images: [
      "https://images.unsplash.com/photo-1517520287167-4bbf64a00d66?q=80&w=1200",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1200",
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200"
    ],
    savePercent: 7,
    badge: "Family pick",
    host: {
      name: "Blerim",
      profileImage: "https://randomuser.me/api/portraits/men/19.jpg",
      joinedYear: 2024
    },
    location: {
      address: "Pristina Airport Road",
      lat: 42.603,
      lng: 21.026
    },
    unavailableDates: [],
    isAvailable: true
  }
];

const seedCars = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("MongoDB connected for seeding");

    await Car.deleteMany();
    console.log("Old cars removed");

    await Car.insertMany(cars);
    console.log("Cars seeded successfully");

    process.exit();
  } catch (error) {
    console.error("Seeding failed:", error.message);
    process.exit(1);
  }
};

seedCars();