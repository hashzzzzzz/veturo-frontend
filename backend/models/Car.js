import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    brand: {
      type: String,
      required: true,
      trim: true,
    },

    model: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    type: {
      type: String,
      required: true,
      trim: true,
    },

    transmission: {
      type: String,
      required: true,
      trim: true,
    },

    fuelType: {
      type: String,
      required: true,
      trim: true,
    },

    seats: {
      type: Number,
      required: true,
    },

    isCityListing: {
      type: Boolean,
      default: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    isAirportListing: {
      type: Boolean,
      default: false,
    },

    airport: {
      type: String,
      default: null,
      trim: true,
    },

    deliveryAirports: {
      type: [String],
      default: [],
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    googleMapsUrl: {
      type: String,
      default: "",
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    dailyPrice: {
      type: Number,
      required: true,
    },

    isMonthlyAvailable: {
      type: Boolean,
      default: false,
    },

    monthlyPrice: {
      type: Number,
      default: 0,
    },

    images: {
      type: [String],
      default: [],
    },

    hostPhone: {
      type: String,
      default: "",
      trim: true,
    },

    hostAvatar: {
      type: String,
      default: "",
      trim: true,
    },

    features: {
      safety: {
        type: [String],
        default: [],
      },
      tech: {
        type: [String],
        default: [],
      },
      convenience: {
        type: [String],
        default: [],
      },
      defects: {
        type: [String],
        default: [],
      },
    },

    blockedDates: {
      type: [String],
      default: [],
    },

    freeDates: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
    },

    trips: {
      type: Number,
      default: 0,
    },

    /*
      OLD FLAGS
      keep them so you don't lose old logic/data
    */
    isApproved: {
      type: Boolean,
      default: false,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },

    featuredSection: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      NEW APPROVAL FLOW
    */
    approvalStatus: {
      type: String,
      enum: ["pending", "changes_requested", "approved", "rejected"],
      default: "pending",
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    adminNotes: {
      type: String,
      default: "",
      trim: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    lastSubmittedAt: {
      type: Date,
      default: Date.now,
    },

    publishedAt: {
      type: Date,
      default: null,
    },

    /*
      SUPERADMIN MANUAL FEATURED SECTIONS
      this is the title superadmin chooses
    */
    featuredSectionTitle: {
      type: String,
      default: "",
      trim: true,
    },

    /*
      safe key version of title for grouping rows in frontend
      ex: "Prishtina Airport Deals" -> "prishtina-airport-deals"
    */
    featuredSectionKey: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

carSchema.pre("validate", function (next) {
  const hasCity = Boolean(this.isCityListing);
  const hasAirport = Boolean(this.isAirportListing);

  // must choose exactly one
  if (!hasCity && !hasAirport) {
    this.invalidate(
      "city",
      "Car must be listed in one place: city or airport"
    );
  }

  if (hasCity && hasAirport) {
    this.invalidate(
      "airport",
      "Car cannot be listed as both city and airport at the same time"
    );
  }

  if (hasCity) {
    if (!this.city?.trim()) {
      this.invalidate("city", "City is required when city listing is enabled");
    }
    this.airport = null;
  }

  if (hasAirport) {
    if (!this.airport?.trim()) {
      this.invalidate(
        "airport",
        "Airport is required when airport listing is enabled"
      );
    }
    this.city = "";
  }

  if (
    this.isMonthlyAvailable &&
    (!this.monthlyPrice || this.monthlyPrice <= 0)
  ) {
    this.invalidate(
      "monthlyPrice",
      "Monthly price is required when monthly listing is enabled"
    );
  }

  next();
});

carSchema.pre("save", function (next) {
  /*
    sync old and new approval fields
    so your old code doesn't break
  */

  if (this.approvalStatus === "approved") {
    this.isApproved = true;
  }

  if (
    this.approvalStatus === "pending" ||
    this.approvalStatus === "changes_requested" ||
    this.approvalStatus === "rejected"
  ) {
    this.isApproved = false;
  }

  /*
    keep old featuredSection in sync with new title
  */
  if (this.featuredSectionTitle?.trim()) {
    this.featuredSection = this.featuredSectionTitle.trim();
  }

  /*
    if car is featured manually, make sure title exists
  */
  if (
    this.isFeatured &&
    !this.featuredSectionTitle?.trim() &&
    this.featuredSection?.trim()
  ) {
    this.featuredSectionTitle = this.featuredSection.trim();
  }

  /*
    auto-create key from title
  */
  if (this.featuredSectionTitle?.trim()) {
    this.featuredSectionKey = this.featuredSectionTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  } else {
    this.featuredSectionKey = "";
  }

  /*
    if approved and published, keep dates
  */
  if (
    this.isPublished &&
    this.approvalStatus === "approved" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }

  next();
});

const Car = mongoose.model("Car", carSchema);

export default Car;