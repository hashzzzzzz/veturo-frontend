import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import GalleryModal from "../components/GalleryModal";
import CarDetailsLoader from "./CarDetailsLoader";
import API_URL from "../config/api";
import { trackEvent } from "../utils/analytics";
import "./carDetails.css";

const MONTH_NAMES = {
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
  al: [
    "janar",
    "shkurt",
    "mars",
    "prill",
    "maj",
    "qershor",
    "korrik",
    "gusht",
    "shtator",
    "tetor",
    "nentor",
    "dhjetor",
  ],
};

function normalizeLanguage(language = "en") {
  return language === "al" || language === "sq" ? "al" : "en";
}

function formatDateInput(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatBlockedDate(dateString, language = "en") {
  if (!dateString) return "";

  const [year, month, day] = String(dateString).split("-").map(Number);
  const months = MONTH_NAMES[language] || MONTH_NAMES.en;

  if (!year || !month || !day || !months[month - 1]) {
    return dateString;
  }

  return `${day} ${months[month - 1]}`.toUpperCase();
}

function formatBookingDateLabel(dateString, language = "en") {
  if (!dateString) return "";

  const [year, month, day] = String(dateString).split("-").map(Number);
  const months = MONTH_NAMES[language] || MONTH_NAMES.en;

  if (!year || !month || !day || !months[month - 1]) {
    return dateString;
  }

  return `${day} ${months[month - 1]}`;
}

const LISTING_TEXT_TRANSLATIONS = {
  en: {
    "kamera mbrapa": "Rear camera",
    "kamera e pasme": "Rear camera",
    "sensor parkimi": "Parking sensors",
    "sensore parkimi": "Parking sensors",
    "sedilje me ngrohje": "Heated seats",
    "ulese me ngrohje": "Heated seats",
    "karrige per femije": "Child seat",
    "karrige per femije falas": "Free child seat",
    "bluetooth": "Bluetooth",
    "navigacion": "Navigation",
    "gps": "GPS",
    "apple carplay": "Apple CarPlay",
    "android auto": "Android Auto",
    "karikues telefoni": "Phone charger",
    "usb": "USB",
    "abs": "ABS",
    "airbag": "Airbags",
    "airbags": "Airbags",
    "kontroll stabiliteti": "Stability control",
    "kontroll terheqjeje": "Traction control",
    "asistence frenimi": "Brake assist",
    "klime": "Air conditioning",
    "klima": "Air conditioning",
    "kondicioner": "Air conditioning",
    "automatik": "Automatic",
    "manual": "Manual",
    "nafte": "Diesel",
    "dizel": "Diesel",
    "benzine": "Petrol",
    "benzin": "Petrol",
    "hibrid": "Hybrid",
    "elektrik": "Electric",
    "ekonomike": "Economical",
    "shume e paster": "Very clean",
    "e paster": "Clean",
    "veture familjare": "Family car",
    "makine familjare": "Family car",
    "veture komode": "Comfortable car",
    "makine komode": "Comfortable car",
    "ne gjendje te mire": "In good condition",
    "e pershtatshme per udhetime te gjata": "Suitable for long trips",
    "e pershtatshme per qytet": "Suitable for city driving",
    "hapesire bagazhi": "Luggage space",
    "bagazh i madh": "Large trunk",
  },
  al: {
    "rear camera": "Kamera mbrapa",
    "backup camera": "Kamera mbrapa",
    "parking sensors": "Sensore parkimi",
    "heated seats": "Ulese me ngrohje",
    "child seat": "Karrige per femije",
    "free child seat": "Karrige per femije falas",
    "bluetooth": "Bluetooth",
    "navigation": "Navigacion",
    "gps": "GPS",
    "apple carplay": "Apple CarPlay",
    "android auto": "Android Auto",
    "phone charger": "Karikues telefoni",
    "usb": "USB",
    "abs": "ABS",
    "airbags": "Airbag",
    "airbag": "Airbag",
    "stability control": "Kontroll stabiliteti",
    "traction control": "Kontroll terheqjeje",
    "brake assist": "Asistence frenimi",
    "air conditioning": "Klime",
    "a/c": "Klime",
    "automatic": "Automatik",
    "manual": "Manual",
    "diesel": "Dizel",
    "petrol": "Benzine",
    "gasoline": "Benzine",
    "hybrid": "Hibrid",
    "electric": "Elektrik",
    "economical": "Ekonomike",
    "very clean": "Shume e paster",
    "clean": "E paster",
    "family car": "Veture familjare",
    "comfortable car": "Veture komode",
    "in good condition": "Ne gjendje te mire",
    "suitable for long trips": "E pershtatshme per udhetime te gjata",
    "suitable for city driving": "E pershtatshme per qytet",
    "luggage space": "Hapesire bagazhi",
    "large trunk": "Bagazh i madh",
  },
};

function normalizeListingText(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s/+.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function matchCase(original = "", translated = "") {
  if (!original || !translated) return translated;
  if (original === original.toUpperCase()) return translated.toUpperCase();
  if (original[0] === original[0].toUpperCase()) {
    return `${translated[0]?.toUpperCase() || ""}${translated.slice(1)}`;
  }
  return translated;
}

function translateListingText(value = "", language = "en") {
  if (!value) return "";

  const dictionary = LISTING_TEXT_TRANSLATIONS[normalizeLanguage(language)] || {};
  const original = String(value).trim();
  const normalized = normalizeListingText(original);

  if (!normalized) return original;
  if (dictionary[normalized]) return matchCase(original, dictionary[normalized]);

  const translated = Object.entries(dictionary).reduce((text, [source, target]) => {
    const escapedSource = source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return text.replace(new RegExp(`\\b${escapedSource}\\b`, "gi"), (match) =>
      matchCase(match, target)
    );
  }, original);

  return translated;
}

function formatCalendarTitle(date, language = "en") {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return "";
  }

  const months = MONTH_NAMES[language] || MONTH_NAMES.en;
  return `${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getMonthGrid(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalDays = lastDay.getDate();

  const days = [];

  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let day = 1; day <= totalDays; day++) days.push(new Date(year, month, day));

  return days;
}

function getInlineFallbackImage(label = "Veturo") {
  const safeLabel = encodeURIComponent(label);
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1400" height="900" viewBox="0 0 1400 900">
      <rect width="1400" height="900" fill="#f3f4f6"/>
      <rect x="40" y="40" width="1320" height="820" rx="40" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="56" fill="#6b7280">${safeLabel}</text>
    </svg>
  `)}`;
}

function transformCloudinaryImage(url = "", transform = "f_auto,q_auto") {
  if (!url || typeof url !== "string") return "";
  if (url.startsWith("data:image/")) return url;

  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/${transform}/`);
  }

  return url;
}

function getHeroImage(url = "", title = "Veturo") {
  if (!url) return getInlineFallbackImage(title);
  return transformCloudinaryImage(url, "f_auto,q_55,fl_progressive,dpr_auto,w_960,h_620,c_fill");
}

function getThumbImage(url = "", title = "Veturo") {
  if (!url) return getInlineFallbackImage(title);
  return transformCloudinaryImage(url, "f_auto,q_55,fl_progressive,dpr_auto,w_360,h_240,c_fill");
}

function getAvatarImage(url = "") {
  if (!url) return "";
  return transformCloudinaryImage(url, "f_auto,q_auto,dpr_auto,w_96,h_96,c_fill");
}

function preloadImage(src) {
  if (!src) return;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
}

function warmConnection(url = "") {
  if (typeof document === "undefined" || !url) return;

  try {
    const origin = new URL(url).origin;

    ["dns-prefetch", "preconnect"].forEach((rel) => {
      const selector = `link[rel="${rel}"][href="${origin}"]`;
      if (document.head.querySelector(selector)) return;

      const link = document.createElement("link");
      link.rel = rel;
      link.href = origin;

      if (rel === "preconnect") {
        link.crossOrigin = "anonymous";
      }

      document.head.appendChild(link);
    });
  } catch {
    // ignore invalid URLs
  }
}

function getCacheKey(id) {
  return `veturo_car_full_${id}`;
}

function readCachedCar(id) {
  try {
    const raw = sessionStorage.getItem(getCacheKey(id));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCachedCar(id, car) {
  try {
    sessionStorage.setItem(getCacheKey(id), JSON.stringify(car));
  } catch {
    // ignore
  }
}

function sanitizePhoneNumber(phone = "") {
  return String(phone).replace(/[^\d+]/g, "").trim();
}

function normalizeWhatsAppPhone(phone = "") {
  return sanitizePhoneNumber(phone).replace(/\D/g, "");
}

function getContactPlace(car) {
  if (car?.featuredSection) return car.featuredSection;
  if (car?.location) return car.location;
  if (car?.city) return car.city;
  if (car?.airport) return car.airport;
  return "lokacionin e listimit";
}

function buildContactMessage(car) {
  const title = car?.title || "Nissan";
  const contactPlace = getContactPlace(car);
  return `Nga Veturo: Pershendetje, jam i interesuar per "${title}" ne ${contactPlace}. Lokacioni: ${car?.location || "."}`;
}

function buildWhatsAppLink(phone, message) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  if (!normalizedPhone) return "";
  const encodedMessage = encodeURIComponent(message || "");
  return `https://wa.me/${normalizedPhone}${encodedMessage ? `?text=${encodedMessage}` : ""}`;
}

function buildViberLink(viberUri = "", message = "") {
  const cleanUri = String(viberUri || "").trim();
  if (!cleanUri) return "";

  const encodedMessage = encodeURIComponent(message || "");

  if (cleanUri.startsWith("viber://")) {
    return encodedMessage
      ? `${cleanUri}${cleanUri.includes("?") ? "&" : "?"}text=${encodedMessage}`
      : cleanUri;
  }

  if (cleanUri.startsWith("https://")) return cleanUri;

  return `viber://pa?chatURI=${encodeURIComponent(cleanUri)}${
    encodedMessage ? `&text=${encodedMessage}` : ""
  }`;
}

function setMetaByName(name, content) {
  if (typeof document === "undefined" || !content) return;

  let element = document.head.querySelector(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (typeof document === "undefined" || !content) return;

  let element = document.head.querySelector(`meta[property="${property}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setJsonLd(id, data) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector(`script[data-jsonld="${id}"]`);

  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.setAttribute("data-jsonld", id);
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

function getSeoLocation(car) {
  if (car?.city) return car.city;
  if (car?.airport) return `${String(car.airport).toUpperCase()} Airport`;
  if (car?.location) return car.location;
  return "Balkan";
}

function getCanonicalCarImage(car) {
  const image = Array.isArray(car?.images) ? car.images[0] : "";

  if (!image || image.startsWith("data:image/")) {
    return "https://veturocars.com/favicon.svg";
  }

  return image;
}

function mergeCarData(baseCar, freshCar) {
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

    // 🔥 FIX: NEVER downgrade images
    images:
      freshImages.length >= baseImages.length
        ? freshImages
        : baseImages,

    blockedDates:
      Array.isArray(freshCar.blockedDates)
        ? freshCar.blockedDates
        : baseCar.blockedDates || [],
  };
}

export default function CarDetails({ favorites = [], language = "en" }) {
  const normalizedLanguage = normalizeLanguage(language);
  const copy = {
    en: {
      openingRide: "Opening your ride",
      notFound: "Car not found.",
      galleryHint: "Tap to explore full gallery",
      seats: "seats",
      trips: "trips",
      hostedBy: "Hosted by",
      host: "Host",
      phone: "Phone",
      noNumber: "No number available",
      pressToCopy: "Press to copy",
      copyPhone: "Copy phone number",
      contactWhatsapp: "Contact on WhatsApp",
      continueViber: "Continue on Viber",
      aboutCar: "About this car",
      vehicleFeatures: "Vehicle features",
      safety: "Safety",
      convenience: "Convenience",
      tech: "Tech",
      unavailableDates: "Unavailable dates",
      yourTrip: "Your trip",
      tripStart: "Trip start",
      tripEnd: "Trip end",
      available: "Available",
      selected: "Selected",
      blocked: "Blocked",
      pickupReturn: "Pickup & return location",
      perDay: "/ day",
      internalChat: "Internal Chat",
      internalChatBadge: "Internal chat",
      chatSoon: "Chat is coming soon",
      chatSoonText:
        "Direct chat between the customer and the car renter will be enabled when the Veturo mobile application is finished.",
      gotIt: "Got it",
      calendarWeekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    al: {
      openingRide: "Po hapim veturen tende",
      notFound: "Vetura nuk u gjet.",
      galleryHint: "Prek per te eksploruar galerine e plote",
      seats: "ulese",
      trips: "udhetime",
      hostedBy: "Publikuar nga",
      host: "Host",
      phone: "Telefoni",
      noNumber: "Nuk ka numer te disponueshem",
      pressToCopy: "Shtyp per ta kopjuar",
      copyPhone: "Kopjo numrin e telefonit",
      contactWhatsapp: "Kontakto ne WhatsApp",
      continueViber: "Vazhdo ne Viber",
      aboutCar: "Rreth kesaj veture",
      vehicleFeatures: "Karakteristikat e vetures",
      safety: "Siguria",
      convenience: "Komoditeti",
      tech: "Teknologjia",
      unavailableDates: "Datat e padisponueshme",
      yourTrip: "Udhetimi yt",
      tripStart: "Fillimi i udhetimit",
      tripEnd: "Mbarimi i udhetimit",
      available: "E lire",
      selected: "E zgjedhur",
      blocked: "E bllokuar",
      pickupReturn: "Lokacioni i marrjes dhe kthimit",
      perDay: "/ dite",
      internalChat: "Chat i brendshem",
      internalChatBadge: "Chat i brendshem",
      chatSoon: "Chati vjen se shpejti",
      chatSoonText:
        "Biseda direkte mes klientit dhe qiradhenesit do te aktivizohet kur aplikacioni mobil i Veturo te perfundoje.",
      gotIt: "Ne rregull",
      calendarWeekdays: ["Hen", "Mar", "Mer", "Enj", "Pre", "Sht", "Die"],
    },
  }[normalizedLanguage] || {
    openingRide: "Opening your ride",
  };
  const { id } = useParams();
  const location = useLocation();

  const carFromState = useMemo(() => {
    const routeCar = location.state?.car;
    if (!routeCar) return null;

    return String(routeCar._id || routeCar.id) === String(id) ? routeCar : null;
  }, [id, location.state]);

  const cachedCar = useMemo(() => readCachedCar(id), [id]);
  const introRequested = useMemo(() => location.state?.showIntroLoader === true, [location.state]);
  const favoriteCar = useMemo(
    () =>
      favorites.find((item) => String(item?._id || item?.id) === String(id)) || null,
    [favorites, id]
  );
  const hasInstantDetails = Boolean(cachedCar);

  const initialCar = useMemo(() => {
  // 🔥 ALWAYS prefer cached FULL data first
    if (cachedCar) return cachedCar;

  // fallback to navigation state
    if (carFromState) return carFromState;

    if (favoriteCar) return favoriteCar;

    return null;
  }, [carFromState, cachedCar, favoriteCar]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const minDate = useMemo(() => formatDateInput(today), [today]);

  const [car, setCar] = useState(initialCar);
  const [loading, setLoading] = useState(introRequested || !hasInstantDetails);

  const [startDate, setStartDate] = useState(minDate);
  const [endDate, setEndDate] = useState(minDate);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:00");
  const [selectedImage, setSelectedImage] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [modalStartIndex, setModalStartIndex] = useState(0);
  const [chatPopupOpen, setChatPopupOpen] = useState(false);
  const [showIntroLoader, setShowIntroLoader] = useState(introRequested);
  const [hideIntroLoader, setHideIntroLoader] = useState(false);
  const [introMinDone, setIntroMinDone] = useState(!introRequested);

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [activePicker, setActivePicker] = useState(null);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [id]);

  useEffect(() => {
    setCar(initialCar);
    setLoading(introRequested || !hasInstantDetails);
  }, [id, initialCar, hasInstantDetails, introRequested]);

  useEffect(() => {
    setShowIntroLoader(introRequested);
    setHideIntroLoader(false);
    setIntroMinDone(!introRequested);
  }, [id, introRequested]);

  useEffect(() => {
    if (!introRequested) return;

    const timer = setTimeout(() => {
      setIntroMinDone(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [id, introRequested]);

  useEffect(() => {
    warmConnection(API_URL);
    warmConnection("https://res.cloudinary.com");
  }, []);

  useEffect(() => {
    if (!carFromState) return;
    writeCachedCar(id, mergeCarData(readCachedCar(id), carFromState));
  }, [carFromState, id]);

  useEffect(() => {
    if (!favoriteCar) return;

    setCar((prev) => mergeCarData(prev, favoriteCar));
    writeCachedCar(id, mergeCarData(readCachedCar(id), favoriteCar));
  }, [favoriteCar, id]);

  useEffect(() => {
    if (!showIntroLoader || loading || !introMinDone) return;

    setHideIntroLoader(true);
    const timer = setTimeout(() => {
      setShowIntroLoader(false);
      setHideIntroLoader(false);
    }, 420);

    return () => clearTimeout(timer);
  }, [introMinDone, loading, showIntroLoader]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    async function fetchCar() {
      try {
        const res = await fetch(`${API_URL}/cars/${id}`, {
          signal: controller.signal,
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch car");
        }

        writeCachedCar(id, data);

        if (isMounted) {
          setCar((prev) => {
            const merged = mergeCarData(prev, data);
            writeCachedCar(id, merged);
            return merged;
          });
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Failed to fetch car:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchCar();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!car?.images?.length) {
      setSelectedImage(0);
      setModalStartIndex(0);
      return;
    }

    if (selectedImage > car.images.length - 1) setSelectedImage(0);
    if (modalStartIndex > car.images.length - 1) setModalStartIndex(0);
  }, [car, selectedImage, modalStartIndex]);

  useEffect(() => {
    const selectedBaseDate = activePicker === "end" ? endDate : startDate;
    if (selectedBaseDate) {
      const d = new Date(selectedBaseDate);
      if (!Number.isNaN(d.getTime())) {
        setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
      }
    }
  }, [activePicker, startDate, endDate]);

  useEffect(() => {
    if (!car) return;

    const preloadUrls = [
      getHeroImage(car.images?.[selectedImage] || car.images?.[0] || "", car.title || "Veturo"),
      getHeroImage(car.images?.[selectedImage + 1] || "", car.title || "Veturo"),
    ].filter(Boolean);
    // 🔥 force early evaluation of contact data


    preloadUrls.forEach((src) => {
      preloadImage(src);
    });
  }, [car, selectedImage]);

  useEffect(() => {
    if (!car) return;

    const seoLocation = getSeoLocation(car);
    const title = `${car.title} Rent a Car in ${seoLocation} | Veturo Cars`;
    const description = `Book ${car.title} from €${car.dailyPrice || ""}/day with Veturo. View availability, photos and host contact for rent a car in ${seoLocation}, Kosovo, Albania or North Macedonia.`;
    const canonicalUrl = `https://veturocars.com/cars/${id}`;
    const imageUrl = getCanonicalCarImage(car);

    document.title = title;
    setMetaByName("description", description);
    setMetaByProperty("og:type", "product");
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:image", imageUrl);
    setMetaByName("twitter:title", title);
    setMetaByName("twitter:description", description);

    setJsonLd("veturo-car", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: car.title,
      image: imageUrl,
      description: car.description || description,
      brand: car.make || car.type || "Veturo",
      category: "Car rental",
      offers: {
        "@type": "Offer",
        price: car.dailyPrice,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        url: canonicalUrl,
      },
      areaServed: seoLocation,
    });

    setJsonLd("veturo-car-breadcrumb", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Veturo Cars",
          item: "https://veturocars.com/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: car.title,
          item: canonicalUrl,
        },
      ],
    });

    trackEvent("view_car_details", {
      car_id: id,
      car_title: car.title,
      city: car.city,
      airport: car.airport,
      value: car.dailyPrice,
      currency: "EUR",
    });
  }, [car, id]);

  if (!car) {
    if (showIntroLoader) {
      return (
        <CarDetailsLoader
          title={copy.openingRide}
          language={language}
          isClosing={hideIntroLoader}
        />
      );
    }

    return <div className="carDetails__notFound">{copy.notFound}</div>;
  }

  const openGalleryAt = (index = 0) => {
    setModalStartIndex(index);
    setGalleryOpen(true);
  };

  const blockedDates = car.blockedDates || [];

  const isBlocked = (date) => blockedDates.includes(date);

  const isPastDate = (dateString) => {
    const d = new Date(dateString);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  const handleStartDateChange = (value) => {
    if (isBlocked(value) || isPastDate(value)) return;

    setStartDate(value);

    if (endDate < value || isBlocked(endDate)) {
      setEndDate(value);
    }

    setActivePicker(null);
  };

  const handleEndDateChange = (value) => {
    if (isBlocked(value) || isPastDate(value)) return;
    if (value < startDate) return;

    setEndDate(value);
    setActivePicker(null);
  };

  const monthDays = useMemo(() => getMonthGrid(calendarMonth), [calendarMonth]);

  const renderCalendarDay = (dateObj, index) => {
    if (!dateObj) {
      return <div key={`empty-${index}`} className="carDetails__calendarEmpty" />;
    }

    const formatted = formatDateInput(dateObj);
    const blocked = isBlocked(formatted);
    const past = isPastDate(formatted);
    const selected =
      (activePicker === "start" && formatted === startDate) ||
      (activePicker === "end" && formatted === endDate);

    const rangeSelected =
      activePicker !== "start" &&
      activePicker !== "end" &&
      formatted >= startDate &&
      formatted <= endDate;

    const disabled = blocked || past || (activePicker === "end" && formatted < startDate);

    return (
      <button
        key={formatted}
        type="button"
        className={`carDetails__calendarDay
          ${blocked ? "blocked" : ""}
          ${past ? "past" : ""}
          ${selected ? "selected" : ""}
          ${rangeSelected ? "range" : ""}
          ${disabled ? "disabled" : ""}
        `}
        onClick={() => {
          if (disabled) return;
          if (activePicker === "start") handleStartDateChange(formatted);
          else if (activePicker === "end") handleEndDateChange(formatted);
        }}
        disabled={disabled}
      >
        <span>{dateObj.getDate()}</span>
      </button>
    );
  };

  const heroImage = getHeroImage(
    car.images?.[selectedImage] || car.images?.[0] || "",
    car.title || "Veturo"
  );

  const sideImages = (car.images || []).slice(1, 3);
  const hostAvatarSrc = getAvatarImage(car.hostAvatar || car.owner?.avatar || "");

  const contactMessage = buildContactMessage(car);
  const whatsappLink = buildWhatsAppLink(car.hostPhone || "", contactMessage);
  const viberLink = buildViberLink(car.hostViberUri || car.owner?.viberUri || "", contactMessage);

  return (
    <>
      {showIntroLoader ? (
        <CarDetailsLoader
          title={copy.openingRide}
          language={language}
          isClosing={hideIntroLoader}
        />
      ) : null}

      <div className="carDetailsPage">
        <div className="carDetails">
          <div className="carDetails__main">
            <div className="carDetails__gallery">
              <button
                type="button"
                className="carDetails__hero"
                onClick={() => openGalleryAt(selectedImage)}
              >
                <img
                  src={heroImage}
                  alt={car.title}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 900px) 100vw, 66vw"
                  onError={(e) => {
                    e.currentTarget.src = getInlineFallbackImage(car.title || "Veturo");
                  }}
                />

                <div className="carDetails__heroHint">
                  <div className="carDetails__heroHintBadge">
                    <span className="carDetails__heroHintIcon">↗</span>
                    <span>{copy.galleryHint}</span>
                  </div>
                </div>
              </button>

              <div className="carDetails__sideImages">
                {sideImages.map((img, index) => (
                  <button
                    type="button"
                    key={index}
                    className="carDetails__sideImage"
                    onClick={() => openGalleryAt(index + 1)}
                  >
                    <img
                      src={getThumbImage(img, car.title || "Veturo")}
                      alt={`${car.title} ${index + 2}`}
                      loading="lazy"
                      decoding="async"
                      fetchPriority="low"
                      sizes="(max-width: 900px) 50vw, 20vw"
                      onError={(e) => {
                        e.currentTarget.src = getInlineFallbackImage(car.title || "Veturo");
                      }}
                    />

                  </button>
                ))}

              </div>
            </div>

            <div className="carDetails__body">
              <div className="carDetails__left">
                <h1 className="carDetails__title">{car.title}</h1>

                <div className="carDetails__sub">
                  <span>{car.year}</span>
                  <span>•</span>
                  <span>
                    {translateListingText(car.type, normalizedLanguage)}
                  </span>
                  <span>•</span>
                  <span>{car.rating} ★</span>
                  <span>({car.trips} {copy.trips})</span>
                </div>

                <div className="carDetails__chips">
                  <span>{car.seats} {copy.seats}</span>
                  <span>
                    {translateListingText(car.fuelType, normalizedLanguage)}
                  </span>
                  <span>
                    {translateListingText(car.transmission, normalizedLanguage)}
                  </span>
                </div>

                <div className="carDetails__section">
                  <h2>{copy.hostedBy}</h2>
                  <div className="carDetails__host">
                    {hostAvatarSrc ? (
                      <img
                        src={hostAvatarSrc}
                        alt="Host"
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                      />
                    ) : (
                      <div className="carDetails__hostAvatarFallback">👤</div>
                    )}

                    <div className="carDetails__hostInfo">
                      <h3>{car.owner?.name || copy.host}</h3>

                      <div className="carDetails__hostContactCard">
                        <div className="carDetails__hostPhoneWrap">
                          <span className="carDetails__hostPhoneLabel">{copy.phone}</span>
                          <span className="carDetails__hostPhoneValue">
                            {car.hostPhone || copy.noNumber}
                          </span>
                          {car.hostPhone ? (
                            <span className="carDetails__copyHint">{copy.pressToCopy}</span>
                          ) : null}
                        </div>

                        {car.hostPhone ? (
                          <button
                            type="button"
                            className="carDetails__copyPhoneBtn"
                            onClick={() => {
                              trackEvent("click_call_host", {
                                car_id: id,
                                car_title: car.title,
                                city: car.city,
                                airport: car.airport,
                              });
                              navigator.clipboard.writeText(car.hostPhone);
                            }}
                            aria-label={copy.copyPhone}
                            title={copy.copyPhone}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                              <rect x="9" y="9" width="10" height="10" rx="2"></rect>
                              <path d="M7 15H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        ) : null}
                      </div>

                      <div className="carDetails__hostMetaRow">
                        {whatsappLink ? (
                          <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noreferrer"
                            className="carDetails__whatsappBadge"
                            onClick={() =>
                              trackEvent("click_whatsapp", {
                                car_id: id,
                                car_title: car.title,
                                city: car.city,
                                airport: car.airport,
                                source: "host_card",
                              })
                            }
                          >
                            <svg
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              aria-hidden="true"
                              className="carDetails__contactIcon"
                            >
                              <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.86 11.86 0 0 0 5.75 1.47h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.46-8.43ZM12.08 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.23-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.81 9.81 0 0 1 2.9 7c0 5.45-4.44 9.89-9.89 9.89Zm5.42-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.06 2.88 1.2 3.08.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.61.71.22 1.36.19 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                            </svg>
                            <span>{copy.contactWhatsapp}</span>
                          </a>
                        ) : null}

                        {viberLink ? (
                          <a
                            href={viberLink}
                            target="_blank"
                            rel="noreferrer"
                            className="carDetails__whatsappBadge"
                          >
                            {copy.continueViber}
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="carDetails__section">
                  <h2>{copy.aboutCar}</h2>
                  <p>{translateListingText(car.description, normalizedLanguage)}</p>
                </div>

                <div className="carDetails__section">
                  <h2>{copy.vehicleFeatures}</h2>

                  <div className="carDetails__featureBlock">
                    <h4>{copy.safety}</h4>
                    <ul>
                      {car.features?.safety?.map((item, index) => (
                        <li key={item}>
                          {translateListingText(item, normalizedLanguage)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="carDetails__featureBlock">
                    <h4>{copy.convenience}</h4>
                    <ul>
                      {car.features?.convenience?.map((item, index) => (
                        <li key={item}>
                          {translateListingText(item, normalizedLanguage)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="carDetails__featureBlock">
                    <h4>{copy.tech}</h4>
                    <ul>
                      {car.features?.tech?.map((item, index) => (
                        <li key={item}>
                          {translateListingText(item, normalizedLanguage)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {blockedDates.length > 0 && (
                  <div className="carDetails__section">
                    <h2>{copy.unavailableDates}</h2>
                    <div className="carDetails__blockedList">
                      {blockedDates.map((date) => (
                        <span key={date} className="carDetails__blockedChip">
                          {formatBlockedDate(date, normalizedLanguage)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="carDetails__booking">
                <div className="carDetails__bookingCard">
                  <div className="carDetails__priceTop">
                    <span className="carDetails__totalPrice">€{car.dailyPrice} {copy.perDay}</span>
                  </div>

                  <div className="carDetails__bookingSection">
                    <h3>{copy.yourTrip}</h3>

                    <label>{copy.tripStart}</label>
                    <div className="carDetails__dateRow">
                      <button
                        type="button"
                        className={`carDetails__dateTrigger ${activePicker === "start" ? "active" : ""}`}
                        onClick={() => setActivePicker((prev) => (prev === "start" ? null : "start"))}
                      >
                        {formatBookingDateLabel(startDate, normalizedLanguage)}
                      </button>

                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>

                    <label>{copy.tripEnd}</label>
                    <div className="carDetails__dateRow">
                      <button
                        type="button"
                        className={`carDetails__dateTrigger ${activePicker === "end" ? "active" : ""}`}
                        onClick={() => setActivePicker((prev) => (prev === "end" ? null : "end"))}
                      >
                        {formatBookingDateLabel(endDate, normalizedLanguage)}
                      </button>

                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>

                    {activePicker && (
                      <div className="carDetails__calendarCard">
                        <div className="carDetails__calendarHeader">
                          <button
                            type="button"
                            className="carDetails__calendarNav"
                            onClick={() =>
                              setCalendarMonth(
                                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
                              )
                            }
                          >
                            ←
                          </button>

                          <h4 className="carDetails__calendarTitle">
                            {formatCalendarTitle(calendarMonth, normalizedLanguage)}
                          </h4>

                          <button
                            type="button"
                            className="carDetails__calendarNav"
                            onClick={() =>
                              setCalendarMonth(
                                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
                              )
                            }
                          >
                            →
                          </button>
                        </div>

                        <div className="carDetails__calendarWeekdays">
                          {copy.calendarWeekdays.map((day) => (
                            <span key={day}>{day}</span>
                          ))}
                        </div>

                        <div className="carDetails__calendarGrid">
                          {monthDays.map((dateObj, index) => renderCalendarDay(dateObj, index))}
                        </div>

                        <div className="carDetails__calendarLegend">
                          <span className="carDetails__legendItem">
                            <span className="carDetails__legendDot available" />
                            {copy.available}
                          </span>
                          <span className="carDetails__legendItem">
                            <span className="carDetails__legendDot selected" />
                            {copy.selected}
                          </span>
                          <span className="carDetails__legendItem">
                            <span className="carDetails__legendDot blocked" />
                            {copy.blocked}
                          </span>
                        </div>
                      </div>
                    )}

                 
                  </div>

                  <div className="carDetails__bookingSection">
                    <h3>{copy.pickupReturn}</h3>
                    <p>{car.location}</p>
                  </div>

                  {whatsappLink || viberLink ? (
                    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      {whatsappLink ? (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noreferrer"
                          className="carDetails__continue carDetails__continue--whatsapp"
                          onClick={() =>
                            trackEvent("click_whatsapp", {
                              car_id: id,
                              car_title: car.title,
                              city: car.city,
                              airport: car.airport,
                              source: "booking_card",
                            })
                          }
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "10px",
                          }}
                        >
                          <svg
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            className="carDetails__continueIcon"
                          >
                            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.86 11.86 0 0 0 5.75 1.47h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.46-8.43ZM12.08 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.23-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.81 9.81 0 0 1 2.9 7c0 5.45-4.44 9.89-9.89 9.89Zm5.42-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.06 2.88 1.2 3.08.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.61.71.22 1.36.19 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
                          </svg>
                          <span>{copy.contactWhatsapp}</span>
                        </a>
                      ) : null}

                      {viberLink ? (
                        <a
                          href={viberLink}
                          target="_blank"
                          rel="noreferrer"
                          className="carDetails__continue"
                          style={{
                            textDecoration: "none",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {copy.continueViber}
                        </a>
                      ) : null}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="carDetails__continue"
                      onClick={() => setChatPopupOpen(true)}
                    >
                      {copy.internalChat}
                    </button>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>

      <GalleryModal
        isOpen={galleryOpen}
        images={car.images || []}
        startIndex={modalStartIndex}
        onClose={() => setGalleryOpen(false)}
      />

      {chatPopupOpen ? (
        <div
          className="carDetails__chatPopupOverlay"
          onClick={() => setChatPopupOpen(false)}
        >
          <div
            className="carDetails__chatPopup"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="car-details-chat-title"
          >
            <button
              type="button"
              className="carDetails__chatPopupClose"
              onClick={() => setChatPopupOpen(false)}
              aria-label="Close internal chat popup"
            >
              X
            </button>

            <div className="carDetails__chatPopupBadge">{copy.internalChatBadge}</div>
            <h3 id="car-details-chat-title">{copy.chatSoon}</h3>
            <p>{copy.chatSoonText}</p>

            <button
              type="button"
              className="carDetails__chatPopupBtn"
              onClick={() => setChatPopupOpen(false)}
            >
              {copy.gotIt}
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
