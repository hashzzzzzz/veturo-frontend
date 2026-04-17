import "./featuredSections.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import API_URL from "../config/api";
import { trackEvent } from "../utils/analytics";
const DETAIL_CACHE_PREFIX = "veturo_car_full_";
const PREFETCH_LIMIT = 6;

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[ë]/g, "e")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getCanonicalCityName(city = "") {
  const normalized = normalizeText(city);

  const cityAliases = {
    pristina: "Pristina",
    prishtina: "Pristina",
    pirshtina: "Pristina",
    prishtine: "Pristina",
    tirana: "Tirana",
    tirane: "Tirana",
    skopje: "Skopje",
    shkup: "Skopje",
    ferizaj: "Ferizaj",
    urosevac: "Ferizaj",
    gjilan: "Gjilan",
    gnjilane: "Gjilan",
    prizren: "Prizren",
    peja: "Peja",
    pec: "Peja",
    mitrovica: "Mitrovica",
    mitrovice: "Mitrovica",
  };

  return cityAliases[normalized] || city.trim();
}

function getCanonicalAirportSectionTitle(airport = "") {
  const value = (airport || "").trim().toUpperCase();

  const airportAliases = {
    PRN: "Pristina Airport Rental",
    TIA: "Tirana Airport Car Rental",
    SKP: "Skopje Airport Car Rental",
    OHD: "Ohrid Airport Car Rental",
  };

  return airportAliases[value] || `${value} Airport Car Rental`;
}

function getCitySectionMeta(city = "") {
  const canonicalCity = getCanonicalCityName(city);
  return {
    title: `Rent a Car in ${canonicalCity}`,
    key: `city-${slugify(canonicalCity)}`,
  };
}

function getAirportSectionMeta(airport = "") {
  const title = getCanonicalAirportSectionTitle(airport);
  return {
    title,
    key: `airport-${slugify((airport || "").trim().toUpperCase())}`,
  };
}

function normalizeFeaturedSectionMeta(car) {
  const rawTitle = (car.featuredSectionTitle || car.featuredSection || "").trim();

  if (car.isAirportListing && car.airport) {
    const airportMeta = getAirportSectionMeta(car.airport);

    if (!rawTitle) return airportMeta;

    const normalizedRaw = normalizeText(rawTitle);
    const airportCode = (car.airport || "").trim().toUpperCase();

    if (
      normalizedRaw.includes("airport") ||
      normalizedRaw.includes(airportCode.toLowerCase()) ||
      normalizedRaw.includes("pristina") ||
      normalizedRaw.includes("tirana") ||
      normalizedRaw.includes("skopje")
    ) {
      return airportMeta;
    }

    return {
      title: rawTitle,
      key: slugify(rawTitle),
    };
  }

  if (car.isCityListing && car.city) {
    const cityMeta = getCitySectionMeta(car.city);

    if (!rawTitle) return cityMeta;

    const normalizedRaw = normalizeText(rawTitle);
    const normalizedCity = normalizeText(getCanonicalCityName(car.city));

    if (
      normalizedRaw.includes(normalizedCity) &&
      (normalizedRaw.includes("city") || normalizedRaw.includes("rental"))
    ) {
      return cityMeta;
    }

    return {
      title: rawTitle,
      key: slugify(rawTitle),
    };
  }

  if (rawTitle) {
    return {
      title: rawTitle,
      key: slugify(rawTitle),
    };
  }

  return {
    title: "Other Rentals",
    key: "other-rentals",
  };
}

function getAvailabilityText(blockedDates = [], copy) {
  if (!Array.isArray(blockedDates) || blockedDates.length === 0) {
    return copy.availableDatesOpen;
  }

  return copy.blockedDates(blockedDates.length);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDatesInRange(start, end) {
  if (!start || !end) return [];

  const dates = [];
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);

  const last = new Date(end);
  last.setHours(0, 0, 0, 0);

  while (current <= last) {
    dates.push(formatLocalDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function hasDateConflict(car, fromDate, untilDate) {
  if (!fromDate || !untilDate) return false;

  const selectedDates = getDatesInRange(fromDate, untilDate);
  const blocked = Array.isArray(car.blockedDates) ? car.blockedDates : [];

  return selectedDates.some((date) => blocked.includes(date));
}

function chunkArray(items = [], size = 6) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getInlineFallbackImage(label = "Veturo") {
  const safeLabel = encodeURIComponent(label);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="700" height="450" viewBox="0 0 700 450">
      <rect width="700" height="450" fill="#f3f4f6"/>
      <rect x="24" y="24" width="652" height="402" rx="28" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="34" fill="#6b7280">${safeLabel}</text>
    </svg>
  `)}`;
}

function transformCloudinaryImage(url = "", transform = "f_auto,q_auto,w_700,h_450,c_fill") {
  if (!url || typeof url !== "string") return "";

  if (url.startsWith("data:image/")) {
    return url;
  }

  if (!url.includes("res.cloudinary.com") || !url.includes("/upload/")) {
    return url;
  }

  return url.replace("/upload/", `/upload/${transform}/`);
}

function getOptimizedCardImage(imageUrl = "", title = "Veturo") {
  if (!imageUrl || typeof imageUrl !== "string") {
    return getInlineFallbackImage(title);
  }

  if (imageUrl.startsWith("data:image/")) {
    return imageUrl;
  }

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    return transformCloudinaryImage(
      imageUrl,
      "f_auto,q_auto,w_700,h_450,c_fill"
    );
  }

  return imageUrl;
}

function getDetailCacheKey(id) {
  return `${DETAIL_CACHE_PREFIX}${id}`;
}

function getIntroSeenKey(id) {
  return `veturo_car_intro_seen_${id}`;
}

function readDetailCache(id) {
  try {
    const raw = sessionStorage.getItem(getDetailCacheKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDetailCache(id, car) {
  try {
    sessionStorage.setItem(getDetailCacheKey(id), JSON.stringify(car));
  } catch {
    // ignore
  }
}

function preloadImage(src = "") {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

function getDetailHeroImage(url = "", title = "Veturo") {
  if (!url) return getInlineFallbackImage(title);
  return transformCloudinaryImage(url, "f_auto,q_55,fl_progressive,dpr_auto,w_960,h_620,c_fill");
}

function getDetailThumbImage(url = "", title = "Veturo") {
  if (!url) return getInlineFallbackImage(title);
  return transformCloudinaryImage(url, "f_auto,q_55,fl_progressive,dpr_auto,w_360,h_240,c_fill");
}

function getDetailAvatarImage(url = "") {
  if (!url) return "";
  return transformCloudinaryImage(url, "f_auto,q_auto,dpr_auto,w_96,h_96,c_fill");
}

function mergeDetailCarData(baseCar, freshCar) {
  if (!baseCar) return freshCar;
  if (!freshCar) return baseCar;

  const baseImages = Array.isArray(baseCar.images) ? baseCar.images : [];
  const freshImages = Array.isArray(freshCar.images) ? freshCar.images : [];

  return {
    ...baseCar,
    ...freshCar,
    owner: {
      ...(baseCar.owner || {}),
      ...(freshCar.owner || {}),
    },
    features: {
      ...(baseCar.features || {}),
      ...(freshCar.features || {}),
    },
    images: freshImages.length >= baseImages.length ? freshImages : baseImages,
    blockedDates: Array.isArray(freshCar.blockedDates)
      ? freshCar.blockedDates
      : baseCar.blockedDates || [],
  };
}

export default function FeaturedSections({
  language = "en",
  activeFilter = "All",
  favorites = [],
  toggleFavorite,
  isFavorite,
  searchData,
}) {
  const copy = {
    en: {
      otherRentals: "Other Rentals",
      availableDatesOpen: "Available dates open",
      blockedDates: (count) => `${count} blocked date${count > 1 ? "s" : ""}`,
      loadingCars: "Loading cars...",
      noCars: "No available cars found for this search.",
      watchMore: "Watch more",
      trips: "trips",
      perDay: "/ day",
      view: "View",
      sectionDescription: (title) =>
        `${title} options for airport, city and daily car rental with local Veturo hosts.`,
    },
    al: {
      otherRentals: "Qira te tjera",
      availableDatesOpen: "Datat e lira jane te hapura",
      blockedDates: (count) => `${count} date te bllokuara`,
      loadingCars: "Duke ngarkuar veturat...",
      noCars: "Nuk u gjet asnje veture e lire per kete kerkim.",
      watchMore: "Shiko me shume",
      trips: "udhetime",
      perDay: "/ dite",
      view: "Shiko",
      sectionDescription: (title) =>
        `${title} per qira ditore, qira ne qytet dhe qira ne aeroport me hoste lokale te Veturo.`,
    },
  }[language] || {
    otherRentals: "Other Rentals",
  };
  const navigate = useNavigate();
  const sectionRefs = useRef({});
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1400
  );

  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);

        const params = new URLSearchParams();

        if (searchData?.city?.trim()) {
          params.append("city", searchData.city.trim());
        }

        if (searchData?.airport?.trim()) {
          params.append("airport", searchData.airport.trim().toUpperCase());
        }

        const url = `${API_URL}/cars${params.toString() ? `?${params.toString()}` : ""}`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to fetch cars");
        setCars(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch cars:", err);
        setCars([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [searchData?.city, searchData?.airport]);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      if (activeFilter === "Airports" && !(car.isAirportListing && car.airport)) {
        return false;
      }

      if (activeFilter === "Cities" && !(car.isCityListing && car.city)) {
        return false;
      }

      if (activeFilter === "Monthly" && !car.isMonthlyAvailable) {
        return false;
      }

      if (!searchData) return true;

      const searchCity = searchData.city?.trim().toLowerCase();
      const searchAirport = searchData.airport?.trim().toUpperCase();
      const fromDate = searchData.fromDate;
      const untilDate = searchData.untilDate;

      if (searchCity) {
        const carCity = car.city?.trim().toLowerCase();
        if (carCity !== searchCity) return false;
      }

      if (searchAirport) {
        const carAirport = car.airport?.trim().toUpperCase();
        if (carAirport !== searchAirport) return false;
      }

      if (fromDate && untilDate && hasDateConflict(car, fromDate, untilDate)) {
        return false;
      }

      return true;
    });
  }, [cars, activeFilter, searchData]);

  const groupedSections = useMemo(() => {
    const grouped = {};

    filteredCars.forEach((car) => {
      const meta = normalizeFeaturedSectionMeta(car);

      if (!grouped[meta.key]) {
        grouped[meta.key] = {
          key: meta.key,
          title: meta.title === "Other Rentals" ? copy.otherRentals : meta.title,
          cars: [],
        };
      }

      grouped[meta.key].cars.push({
        ...car,
        id: car._id,
        pricePerDay: car.dailyPrice,
        availabilityText: getAvailabilityText(car.blockedDates, copy),
        optimizedImage: getOptimizedCardImage(car.images?.[0], car.title || "Veturo"),
      });
    });

    return Object.values(grouped);
  }, [filteredCars, copy]);

  useEffect(() => {
    if (!groupedSections.length) return;

    const candidates = groupedSections
      .flatMap((section) => section.cars)
      .slice(0, PREFETCH_LIMIT);

    if (!candidates.length) return;

    let cancelled = false;
    let idleId = null;
    let timerId = null;
    const controllers = [];

    const prefetchOne = async (car) => {
      const carId = car?._id || car?.id;
      if (!carId || cancelled) return;

      const cached = readDetailCache(carId);
      writeDetailCache(carId, mergeDetailCarData(cached, car));

      if (cached?.images?.length && cached.images.length >= (car.images?.length || 0)) {
        return;
      }

      preloadImage(getDetailHeroImage(car.images?.[0] || "", car.title || "Veturo"));
      preloadImage(getDetailThumbImage(car.images?.[1] || "", car.title || "Veturo"));
      preloadImage(getDetailThumbImage(car.images?.[2] || "", car.title || "Veturo"));
      preloadImage(getDetailAvatarImage(car.hostAvatar || car.owner?.avatar || ""));

      try {
        const controller = new AbortController();
        controllers.push(controller);

        const res = await fetch(`${API_URL}/cars/${carId}`, {
          signal: controller.signal,
        });

        if (!res.ok || cancelled) return;

        const fullCar = await res.json();
        if (cancelled) return;

        writeDetailCache(carId, fullCar);

        preloadImage(getDetailHeroImage(fullCar.images?.[0] || "", fullCar.title || "Veturo"));
        preloadImage(getDetailThumbImage(fullCar.images?.[1] || "", fullCar.title || "Veturo"));
        preloadImage(getDetailThumbImage(fullCar.images?.[2] || "", fullCar.title || "Veturo"));
        preloadImage(getDetailThumbImage(fullCar.images?.[3] || "", fullCar.title || "Veturo"));
        preloadImage(getDetailAvatarImage(fullCar.hostAvatar || fullCar.owner?.avatar || ""));
      } catch {
        // ignore background prefetch failures
      }
    };

    const runPrefetch = async () => {
      for (const car of candidates) {
        if (cancelled) return;
        // sequential keeps homepage lighter
        await prefetchOne(car);
      }
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(runPrefetch, { timeout: 1500 });
    } else {
      timerId = window.setTimeout(runPrefetch, 800);
    }

    return () => {
      cancelled = true;
      controllers.forEach((controller) => controller.abort());
      if (idleId && typeof window !== "undefined" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [groupedSections]);

  useEffect(() => {
    if (!searchData) return;
    if (!groupedSections.length) return;

    let targetKey = searchData.targetSectionKey || "";

    if (!targetKey && searchData.city) {
      const cityName = getCanonicalCityName(searchData.city);
      targetKey = `city-${slugify(cityName)}`;
    }

    if (!targetKey && searchData.airport) {
      targetKey = `airport-${slugify(searchData.airport)}`;
    }

    if (!targetKey) return;

    const timer = setTimeout(() => {
      const targetSection = sectionRefs.current[targetKey];
      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [searchData, groupedSections]);

  const isMobile = windowWidth <= 768;

  const initialVisibleCount = useMemo(() => {
    if (windowWidth > 1100) return 3;
    if (windowWidth > 768) return 2;
    return 6;
  }, [windowWidth]);

  const hasSearchSelection = useMemo(() => {
    return !!(searchData?.city?.trim() || searchData?.airport?.trim());
  }, [searchData]);

  const handleClickPreview = (car) => {
    const carId = car?._id || car?.id;
    if (!carId) return;

    writeDetailCache(carId, mergeDetailCarData(readDetailCache(carId), car));
    preloadImage(getDetailHeroImage(car.images?.[0] || "", car.title || "Veturo"));
    preloadImage(getDetailThumbImage(car.images?.[1] || "", car.title || "Veturo"));
    preloadImage(getDetailAvatarImage(car.hostAvatar || car.owner?.avatar || ""));
  };

  const handleClick = (car) => {
    handleClickPreview(car);
    const carId = car?._id || car?.id;
    let showIntroLoader = false;

    trackEvent("view_car_details", {
      car_id: carId,
      car_title: car?.title,
      city: car?.city,
      airport: car?.airport,
      value: car?.dailyPrice,
      currency: "USD",
    });

    if (carId) {
      try {
        const introSeenKey = getIntroSeenKey(carId);
        showIntroLoader = sessionStorage.getItem(introSeenKey) !== "true";
        if (showIntroLoader) {
          sessionStorage.setItem(introSeenKey, "true");
        }
      } catch {
        showIntroLoader = false;
      }
    }

    navigate(`/cars/${car._id}`, {
      state: {
        car,
        showIntroLoader,
        selectedFromDate: searchData?.fromDate || null,
        selectedUntilDate: searchData?.untilDate || null,
      },
    });
  };

  const expandSection = (sectionKey, totalCars) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionKey]: totalCars,
    }));
  };

  if (loading) {
    return (
      <div className="featured">
        <p className="featuredEmptyText">{copy.loadingCars}</p>
      </div>
    );
  }

  if (!groupedSections.length) {
    return (
      <div className="featured">
        <p className="featuredEmptyText">
          {copy.noCars}
        </p>
      </div>
    );
  }

  return (
    <div className="featured">
      {groupedSections.map((section) => {
        const visibleCount = expandedSections[section.key] || initialVisibleCount;
        const shouldLimit = !hasSearchSelection && section.cars.length > initialVisibleCount;

        const visibleCars = shouldLimit
          ? section.cars.slice(0, visibleCount)
          : section.cars;

        const showWatchMoreButton =
          !hasSearchSelection && visibleCars.length < section.cars.length;

        const mobileRows = isMobile ? chunkArray(visibleCars, 6) : [];

        return (
          <section
            key={section.key}
            className={`featured__section ${
              searchData?.targetSectionKey === section.key ||
              (!searchData?.targetSectionKey &&
                searchData?.city &&
                section.key === `city-${slugify(getCanonicalCityName(searchData.city))}`) ||
              (!searchData?.targetSectionKey &&
                searchData?.airport &&
                section.key === `airport-${slugify(searchData.airport)}`)
                ? "featured__sectionActive"
                : ""
            }`}
            ref={(el) => {
              if (el) sectionRefs.current[section.key] = el;
            }}
          >
            <div className="featured__header">
              <div>
                <h2>{section.title}</h2>
                <p className="featured__description">
                  {copy.sectionDescription(section.title)}
                </p>
              </div>

              {showWatchMoreButton && (
                <button
                  type="button"
                  className="featured__watchMore"
                  onClick={() => expandSection(section.key, section.cars.length)}
                >
                  <span className="featured__watchMoreText">{copy.watchMore}</span>
                  <span className="featured__watchMoreCount">
                    ({section.cars.length - visibleCars.length})
                  </span>
                </button>
              )}
            </div>

            {isMobile ? (
              <div className="featured__mobileRows">
                {mobileRows.map((row, rowIndex) => (
                  <div
                    className="featured__row featured__rowMobile"
                    key={`${section.key}-row-${rowIndex}`}
                  >
                    {row.map((car, index) => (
                      <article
                        key={car._id}
                        className="card"
                        onMouseEnter={() => handleClickPreview(car)}
                        onFocus={() => handleClickPreview(car)}
                        onClick={() => handleClick(car)}
                      >
                        <div className="card__imageWrap">
                          <img
                            src={car.optimizedImage}
                            alt={car.title}
                            loading={rowIndex === 0 && index < 2 ? "eager" : "lazy"}
                            decoding="async"
                            fetchPriority={rowIndex === 0 && index === 0 ? "high" : "auto"}
                            onError={(e) => {
                              e.currentTarget.src = getInlineFallbackImage(car.title || "Veturo");
                            }}
                          />

                          <div className="card__overlayTop">
                            <span className="card__badge">
                              {car.isAirportListing && car.airport
                                ? car.airport
                                : getCanonicalCityName(car.city || "Veturo")}
                            </span>

                            <button
                              type="button"
                              className={`card__heart ${isFavorite?.(car._id) ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                trackEvent("save_favorite", {
                                  car_id: car._id,
                                  car_title: car.title,
                                  city: car.city,
                                  airport: car.airport,
                                });
                                toggleFavorite?.({
                                  id: car._id,
                                  _id: car._id,
                                  title: car.title,
                                  year: car.year,
                                  type: car.type,
                                  pricePerDay: car.dailyPrice,
                                  rating: car.rating,
                                  trips: car.trips,
                                  image: car.optimizedImage,
                                  location: car.location,
                                });
                              }}
                            >
                              ♥
                            </button>
                          </div>

                          <div className="card__overlayBottom">
                            <span className="card__saveOverlay">
                              {car.availabilityText}
                            </span>
                          </div>
                        </div>

                        <div className="card__info">
                          <h3 className="card__title">{car.title}</h3>

                          <div className="card__subline">
                            <span className="card__year">{car.year}</span>
                            <span className="card__dot">•</span>
                            <span className="card__type">{car.type}</span>
                          </div>

                          <div className="card__metaRow">
                            <span className="card__rating">★ {car.rating || 0}</span>
                            <span className="card__trips">{car.trips || 0} {copy.trips}</span>
                          </div>

                          <div className="card__metaRow card__metaRowSmall">
                            <span className="card__availabilityText">
                              {car.availabilityText}
                            </span>
                          </div>

                          <div className="card__bottom">
                            <div className="card__priceWrap">
                              <span className="card__price">${car.dailyPrice}</span>
                              <span className="card__days"> {copy.perDay}</span>
                            </div>

                            <button
                              type="button"
                              className="card__bookBtn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClick(car);
                              }}
                            >
                              {copy.view}
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="featured__row">
                {visibleCars.map((car, index) => (
                  <article
                    key={car._id}
                    className="card"
                    onMouseEnter={() => handleClickPreview(car)}
                    onFocus={() => handleClickPreview(car)}
                    onClick={() => handleClick(car)}
                  >
                    <div className="card__imageWrap">
                      <img
                        src={car.optimizedImage}
                        alt={car.title}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "auto"}
                        onError={(e) => {
                          e.currentTarget.src = getInlineFallbackImage(car.title || "Veturo");
                        }}
                      />

                      <div className="card__overlayTop">
                        <span className="card__badge">
                          {car.isAirportListing && car.airport
                            ? car.airport
                            : getCanonicalCityName(car.city || "Veturo")}
                        </span>

                        <button
                          type="button"
                          className={`card__heart ${isFavorite?.(car._id) ? "active" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            trackEvent("save_favorite", {
                              car_id: car._id,
                              car_title: car.title,
                              city: car.city,
                              airport: car.airport,
                            });
                            toggleFavorite?.({
                              id: car._id,
                              _id: car._id,
                              title: car.title,
                              year: car.year,
                              type: car.type,
                              pricePerDay: car.dailyPrice,
                              rating: car.rating,
                              trips: car.trips,
                              image: car.optimizedImage,
                              location: car.location,
                            });
                          }}
                        >
                          ♥
                        </button>
                      </div>

                      <div className="card__overlayBottom">
                        <span className="card__saveOverlay">
                          {car.availabilityText}
                        </span>
                      </div>
                    </div>

                    <div className="card__info">
                      <h3 className="card__title">{car.title}</h3>

                      <div className="card__subline">
                        <span className="card__year">{car.year}</span>
                        <span className="card__dot">•</span>
                        <span className="card__type">{car.type}</span>
                      </div>

                      <div className="card__metaRow">
                        <span className="card__rating">★ {car.rating || 0}</span>
                        <span className="card__trips">{car.trips || 0} {copy.trips}</span>
                      </div>

                      <div className="card__metaRow card__metaRowSmall">
                        <span className="card__availabilityText">
                          {car.availabilityText}
                        </span>
                      </div>

                      <div className="card__bottom">
                        <div className="card__priceWrap">
                          <span className="card__price">${car.dailyPrice}</span>
                          <span className="card__days"> {copy.perDay}</span>
                        </div>

                        <button
                          type="button"
                          className="card__bookBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClick(car);
                          }}
                        >
                          {copy.view}
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
