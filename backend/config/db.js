import mongoose from "mongoose";

mongoose.set("bufferCommands", false);

function getMongoUrl() {
  const mongoUrl = process.env.MONGO_URL;

  if (!mongoUrl?.startsWith("mongodb+srv://cluster0.w8g34tr.mongodb.net")) {
    return mongoUrl;
  }

  return mongoUrl;
}

function getAtlasDirectUrl(mongoUrl = "") {
  if (!mongoUrl.startsWith("mongodb+srv://")) {
    return mongoUrl;
  }

  try {
    const parsed = new URL(mongoUrl);

    if (parsed.hostname !== "cluster0.w8g34tr.mongodb.net") {
      return mongoUrl;
    }

    const credentials = parsed.username
      ? `${parsed.username}:${parsed.password}@`
      : "";
    const dbPath = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname : "/";
    const params = new URLSearchParams(parsed.search);

    params.set("tls", "true");
    params.set("authSource", params.get("authSource") || "admin");
    params.set("replicaSet", params.get("replicaSet") || "atlas-h1rnqr-shard-0");
    params.set("retryWrites", params.get("retryWrites") || "true");
    params.set("w", params.get("w") || "majority");

    const hosts = [
      "ac-rj6nx9z-shard-00-00.w8g34tr.mongodb.net:27017",
      "ac-rj6nx9z-shard-00-01.w8g34tr.mongodb.net:27017",
      "ac-rj6nx9z-shard-00-02.w8g34tr.mongodb.net:27017",
    ].join(",");

    return `mongodb://${credentials}${hosts}${dbPath}?${params.toString()}`;
  } catch {
    return mongoUrl;
  }
}

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(getAtlasDirectUrl(getMongoUrl()), {
      serverSelectionTimeoutMS: 15000,
      family: 4,
    });
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
