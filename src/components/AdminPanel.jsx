import { useEffect, useMemo, useState } from "react";
import "./host.css";

const API_URL = "http://localhost:5000/api";

function arrayToCommaString(value) {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

function stringToArray(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

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

function getCanonicalAirportName(airport = "") {
  const value = (airport || "").trim().toUpperCase();

  const airportAliases = {
    PRN: "Pristina Airport Rental",
    TIA: "Tirana Airport Rental",
    SKP: "Skopje Airport Rental",
  };

  return airportAliases[value] || `${value} Airport Rental`;
}

function getDefaultFeaturedSectionTitle(car) {
  if (car?.isAirportListing && car?.airport) {
    return getCanonicalAirportName(car.airport);
  }

  if (car?.isCityListing && car?.city) {
    const cityName = getCanonicalCityName(car.city);
    return `${cityName} City Rental`;
  }

  return "Other Rentals";
}

function dedupeSections(cars = []) {
  const map = new Map();

  cars.forEach((car) => {
    const rawTitle =
      car.featuredSectionTitle ||
      car.featuredSection ||
      getDefaultFeaturedSectionTitle(car);

    const finalTitle = rawTitle?.trim() || "Other Rentals";
    const key = slugify(finalTitle);

    if (!map.has(key)) {
      map.set(key, {
        key,
        title: finalTitle,
        count: 0,
        cars: [],
      });
    }

    const section = map.get(key);
    section.count += 1;
    section.cars.push(car);
  });

  return Array.from(map.values())
    .map((section) => ({
      ...section,
      cars: section.cars.sort((a, b) =>
        `${a.title || ""}`.localeCompare(`${b.title || ""}`)
      ),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

function getInitials(name = "") {
  return name
    .split(" ")
    .map((part) => part?.[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getHostAvatar(host) {
  return (
    host?.avatar ||
    host?.profilePic ||
    host?.profileImage ||
    host?.hostAvatar ||
    host?.photo ||
    ""
  );
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthDays(currentMonth) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
  const totalDays = lastDay.getDate();
  const days = [];

  for (let i = 0; i < startWeekday; i++) {
    days.push(null);
  }

  for (let day = 1; day <= totalDays; day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

const emptyFeaturedCarForm = {
  title: "",
  brand: "",
  model: "",
  year: "",
  type: "",
  transmission: "",
  fuelType: "",
  seats: "",
  isCityListing: true,
  city: "",
  isAirportListing: false,
  airport: "",
  deliveryAirportsText: "",
  location: "",
  googleMapsUrl: "",
  description: "",
  dailyPrice: "",
  isMonthlyAvailable: false,
  monthlyPrice: "",
  hostPhone: "",
  imagesText: "",
  blockedDatesText: "",
  freeDatesText: "",
  safety: "",
  tech: "",
  convenience: "",
  defects: "",
  rating: "",
  trips: "",
  isAvailable: true,
  featuredSectionTitle: "",
  adminNotes: "",
};

function arrayToLineString(value) {
  if (!Array.isArray(value)) return "";
  return value.filter(Boolean).join("\n");
}

function lineStringToArray(value) {
  if (!value) return [];
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getFeaturedCarForm(car) {
  return {
    title: car?.title || "",
    brand: car?.brand || "",
    model: car?.model || "",
    year: car?.year || "",
    type: car?.type || "",
    transmission: car?.transmission || "",
    fuelType: car?.fuelType || "",
    seats: car?.seats || "",
    isCityListing: Boolean(car?.isCityListing),
    city: car?.city || "",
    isAirportListing: Boolean(car?.isAirportListing),
    airport: car?.airport || "",
    deliveryAirportsText: arrayToCommaString(car?.deliveryAirports),
    location: car?.location || "",
    googleMapsUrl: car?.googleMapsUrl || "",
    description: car?.description || "",
    dailyPrice: car?.dailyPrice || "",
    isMonthlyAvailable: Boolean(car?.isMonthlyAvailable),
    monthlyPrice: car?.monthlyPrice || "",
    hostPhone: car?.hostPhone || "",
    imagesText: arrayToLineString(car?.images),
    blockedDatesText: arrayToCommaString(car?.blockedDates),
    freeDatesText: arrayToCommaString(car?.freeDates),
    safety: arrayToCommaString(car?.features?.safety),
    tech: arrayToCommaString(car?.features?.tech),
    convenience: arrayToCommaString(car?.features?.convenience),
    defects: arrayToCommaString(car?.features?.defects),
    rating: car?.rating ?? "",
    trips: car?.trips ?? "",
    isAvailable: car?.isAvailable !== false,
    featuredSectionTitle:
      car?.featuredSectionTitle ||
      car?.featuredSection ||
      getDefaultFeaturedSectionTitle(car),
    adminNotes: car?.adminNotes || "",
  };
}

function AccordionSection({
  panelKey,
  title,
  subtitle,
  isOpen,
  onToggle,
  badge,
  children,
}) {
  return (
    <section className="adminAccordionSection">
      <button
        type="button"
        className={`adminAccordionToggle ${isOpen ? "isOpen" : ""}`}
        onClick={() => onToggle(panelKey)}
      >
        <div>
          <div className="adminAccordionTitleRow">
            <h2>{title}</h2>
            {badge ? <span className="adminAccordionBadge">{badge}</span> : null}
          </div>
          {subtitle ? <p className="hostPanelSubtext">{subtitle}</p> : null}
        </div>
        <span className="adminAccordionIcon">{isOpen ? "-" : "+"}</span>
      </button>

      {isOpen ? <div className="adminAccordionBody">{children}</div> : null}
    </section>
  );
}

export default function AdminPanel() {
  const adminToken = localStorage.getItem("token");
  const adminUser = JSON.parse(localStorage.getItem("user") || "null");
  const canManageFeaturedCards = ["admin", "superadmin"].includes(adminUser?.role);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    avatar: "",
  });

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [hosts, setHosts] = useState([]);
  const [allHosts, setAllHosts] = useState([]);
  const [loadingHosts, setLoadingHosts] = useState(true);

  const [editingHost, setEditingHost] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    avatar: "",
  });
  const [savingHost, setSavingHost] = useState(false);
  const [deletingHostId, setDeletingHostId] = useState("");
  const [editAvatarUploading, setEditAvatarUploading] = useState(false);

  const [reviewCars, setReviewCars] = useState([]);
  const [loadingReviewCars, setLoadingReviewCars] = useState(true);

  const [allPublishedCars, setAllPublishedCars] = useState([]);
  const [loadingPublishedCars, setLoadingPublishedCars] = useState(true);

  const [selectedCar, setSelectedCar] = useState(null);

  const [selectedExistingSection, setSelectedExistingSection] = useState("");
  const [newFeaturedTitle, setNewFeaturedTitle] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeSectionEditor, setActiveSectionEditor] = useState(null);
  const [sectionEditorTitle, setSectionEditorTitle] = useState("");
  const [sectionEditorSaving, setSectionEditorSaving] = useState(false);
  const [deletingFeaturedCarId, setDeletingFeaturedCarId] = useState("");
  const [editingFeaturedCar, setEditingFeaturedCar] = useState(null);
  const [featuredCarForm, setFeaturedCarForm] = useState(emptyFeaturedCarForm);
  const [savingFeaturedCar, setSavingFeaturedCar] = useState(false);
  const [openingFeaturedCarId, setOpeningFeaturedCarId] = useState("");
  const [featuredDateMode, setFeaturedDateMode] = useState("blocked");
  const [featuredCalendarMonth, setFeaturedCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [openPanels, setOpenPanels] = useState({
    createHost: false,
    viewHosts: true,
    featuredSections: true,
    reviewCars: true,
  });

  useEffect(() => {
    if (!adminUser || !["admin", "superadmin"].includes(adminUser.role)) {
      setError("Only admin or superadmin can access this page");
      return;
    }

    fetchReviewCars();
    fetchPublishedCars();
    fetchAllHosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePanel = (panelKey) => {
    setOpenPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }));
  };

  const fetchReviewCars = async () => {
    try {
      setLoadingReviewCars(true);
      setError("");

      const res = await fetch(`${API_URL}/cars/admin/review`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch review cars");
      }

      setReviewCars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch review cars");
    } finally {
      setLoadingReviewCars(false);
    }
  };

  const fetchPublishedCars = async () => {
    try {
      setLoadingPublishedCars(true);

      const res = await fetch(`${API_URL}/cars`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch featured cars");
      }

      setAllPublishedCars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch featured cars");
    } finally {
      setLoadingPublishedCars(false);
    }
  };

  const fetchAllHosts = async () => {
    try {
      setLoadingHosts(true);

      const possibleRoutes = [
        `${API_URL}/auth/hosts`,
        `${API_URL}/admin/hosts`,
        `${API_URL}/hosts`,
      ];

      let loadedHosts = [];
      let loaded = false;

      for (const url of possibleRoutes) {
        try {
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          const data = await res.json();

          if (res.ok) {
            loadedHosts = Array.isArray(data)
              ? data
              : Array.isArray(data?.hosts)
              ? data.hosts
              : [];
            loaded = true;
            break;
          }
        } catch {
          // try next route
        }
      }

      if (loaded) {
        setAllHosts(loadedHosts);
      } else {
        setAllHosts([]);
      }
    } catch (err) {
      console.error("Failed to fetch hosts:", err);
      setAllHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  };

  const existingSections = useMemo(() => {
    return dedupeSections(allPublishedCars);
  }, [allPublishedCars]);

  const suggestedSectionTitle = useMemo(() => {
    if (!selectedCar) return "";
    return getDefaultFeaturedSectionTitle(selectedCar);
  }, [selectedCar]);

  const finalFeaturedTitle = useMemo(() => {
    if (newFeaturedTitle.trim()) return newFeaturedTitle.trim();
    if (selectedExistingSection.trim()) return selectedExistingSection.trim();
    if (suggestedSectionTitle.trim()) return suggestedSectionTitle.trim();
    return "";
  }, [newFeaturedTitle, selectedExistingSection, suggestedSectionTitle]);

  const featuredEditorMonthDays = useMemo(
    () => getMonthDays(featuredCalendarMonth),
    [featuredCalendarMonth]
  );

  const mergedHosts = useMemo(() => {
    const map = new Map();

    [...hosts, ...allHosts].forEach((host) => {
      const key = host?._id || host?.email;
      if (!key) return;

      if (!map.has(key)) {
        map.set(key, host);
      } else {
        map.set(key, {
          ...map.get(key),
          ...host,
        });
      }
    });

    return Array.from(map.values());
  }, [hosts, allHosts]);

  const updateHostEverywhere = (updatedHost) => {
    setHosts((prev) =>
      prev.map((host) =>
        (host._id || host.email) === (updatedHost._id || updatedHost.email)
          ? { ...host, ...updatedHost }
          : host
      )
    );

    setAllHosts((prev) =>
      prev.map((host) =>
        (host._id || host.email) === (updatedHost._id || updatedHost.email)
          ? { ...host, ...updatedHost }
          : host
      )
    );
  };

  const removeHostEverywhere = (hostId) => {
    setHosts((prev) => prev.filter((host) => host._id !== hostId));
    setAllHosts((prev) => prev.filter((host) => host._id !== hostId));
    setReviewCars((prev) => prev.filter((car) => car.owner?._id !== hostId));
    setAllPublishedCars((prev) => prev.filter((car) => car.owner?._id !== hostId));
    setSelectedCar((prev) => (prev?.owner?._id === hostId ? null : prev));
    setEditingFeaturedCar((prev) => (prev?.owner?._id === hostId ? null : prev));
    setActiveSectionEditor((prev) => {
      if (!prev) return null;

      const nextCars = prev.cars.filter((car) => car.owner?._id !== hostId);

      return nextCars.length
        ? { ...prev, cars: nextCars, count: nextCars.length }
        : null;
    });
  };

  const handleChange = (e) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      setError("Please select a valid image file");
      return;
    }

    setError("");
    setAvatarUploading(true);

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
      setAvatarUploading(false);
    };

    reader.onerror = () => {
      setError("Failed to read image");
      setAvatarUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const clearAvatar = () => {
    setForm((prev) => ({
      ...prev,
      avatar: "",
    }));
  };

  const openEditHost = (host) => {
    setEditingHost(host);
    setEditForm({
      name: host?.name || "",
      email: host?.email || "",
      avatar: getHostAvatar(host) || "",
    });
    setOpenPanels((prev) => ({
      ...prev,
      viewHosts: true,
    }));
    setError("");
    setMessage("");
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeEditHost = () => {
    setEditingHost(null);
    setEditForm({
      name: "",
      email: "",
      avatar: "",
    });
    setEditAvatarUploading(false);
  };

  const handleEditHostChange = (e) => {
    setEditForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleEditAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      setError("Please select a valid image file");
      return;
    }

    setError("");
    setEditAvatarUploading(true);

    const reader = new FileReader();

    reader.onloadend = () => {
      setEditForm((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
      setEditAvatarUploading(false);
    };

    reader.onerror = () => {
      setError("Failed to read edit image");
      setEditAvatarUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const clearEditAvatar = () => {
    setEditForm((prev) => ({
      ...prev,
      avatar: "",
    }));
  };

  const handleSaveHost = async (e) => {
    e.preventDefault();
    if (!editingHost?._id) return;

    try {
      setSavingHost(true);
      setError("");
      setMessage("");

      const res = await fetch(`${API_URL}/auth/hosts/${editingHost._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          avatar: editForm.avatar.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update host");
      }

      if (data.host) {
        updateHostEverywhere(data.host);
      } else {
        updateHostEverywhere({
          ...editingHost,
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          avatar: editForm.avatar.trim(),
        });
      }

      setMessage("Host updated successfully");
      closeEditHost();
    } catch (err) {
      setError(err.message || "Failed to update host");
    } finally {
      setSavingHost(false);
    }
  };

  const handleDeleteHost = async (host) => {
    if (!host?._id) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete ${host.name || host.email || "this host"} and all cars published by this host?`
    );

    if (!confirmed) return;

    try {
      setDeletingHostId(host._id);
      setError("");
      setMessage("");

      const possibleDeleteRoutes = [
        `${API_URL}/auth/hosts/${host._id}`,
        `${API_URL}/admin/hosts/${host._id}`,
        `${API_URL}/hosts/${host._id}`,
      ];

      let deleted = false;
      let lastError = "Failed to delete host";
      let deletedCarsCount = 0;

      for (const url of possibleDeleteRoutes) {
        try {
          const res = await fetch(url, {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });

          const data = await res.json().catch(() => ({}));

          if (res.ok) {
            deleted = true;
            deletedCarsCount = Number(data.deletedCarsCount || 0);
            removeHostEverywhere(host._id);
            if (editingHost?._id === host._id) {
              closeEditHost();
            }
            break;
          } else {
            lastError = data.message || lastError;
          }
        } catch (err) {
          lastError = err.message || lastError;
        }
      }

      if (!deleted) {
        throw new Error(lastError);
      }

      setMessage(
        deletedCarsCount > 0
          ? `Host deleted successfully. ${deletedCarsCount} car(s) were also removed.`
          : "Host deleted successfully"
      );
    } catch (err) {
      setError(err.message || "Failed to delete host");
    } finally {
      setDeletingHostId("");
    }
  };

  const handleCreateHost = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        avatar: form.avatar.trim(),
      };

      const res = await fetch(`${API_URL}/auth/create-host`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create host");
      }

      setMessage("Host created successfully");

      if (data.host) {
        setHosts((prev) => [data.host, ...prev]);
      }

      setForm({
        name: "",
        email: "",
        password: "",
        avatar: "",
      });

      setOpenPanels((prev) => ({
        ...prev,
        createHost: true,
        viewHosts: true,
      }));

      fetchAllHosts();
    } catch (err) {
      setError(err.message || "Failed to create host");
    }
  };

  const openReview = (car) => {
    const suggested = getDefaultFeaturedSectionTitle(car);

    const matchedExisting = existingSections.find(
      (section) => slugify(section.title) === slugify(suggested)
    );

    setSelectedCar(car);
    setSelectedExistingSection(
      car.featuredSectionTitle ||
        car.featuredSection ||
        matchedExisting?.title ||
        suggested
    );
    setNewFeaturedTitle("");
    setAdminNotes(car.adminNotes || "");
    setOpenPanels((prev) => ({
      ...prev,
      reviewCars: true,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeReview = () => {
    setSelectedCar(null);
    setSelectedExistingSection("");
    setNewFeaturedTitle("");
    setAdminNotes("");
  };

  const previewData = useMemo(() => {
    if (!selectedCar) return null;

    return {
      ...selectedCar,
      safetyText: arrayToCommaString(selectedCar.features?.safety),
      techText: arrayToCommaString(selectedCar.features?.tech),
      convenienceText: arrayToCommaString(selectedCar.features?.convenience),
      defectsText: arrayToCommaString(selectedCar.features?.defects),
    };
  }, [selectedCar]);

  const handleReviewAction = async (action) => {
    if (!selectedCar) return;

    try {
      setReviewLoading(true);
      setMessage("");
      setError("");

      const safeFeaturedTitle = finalFeaturedTitle.trim();

      const payload = {
        action,
        title: selectedCar.title,
        brand: selectedCar.brand,
        model: selectedCar.model,
        year: selectedCar.year,
        type: selectedCar.type,
        transmission: selectedCar.transmission,
        fuelType: selectedCar.fuelType,
        seats: selectedCar.seats,

        isCityListing: selectedCar.isCityListing,
        city: selectedCar.city || "",

        isAirportListing: selectedCar.isAirportListing,
        airport: selectedCar.airport || "",

        location: selectedCar.location,
        googleMapsUrl: selectedCar.googleMapsUrl || "",
        description: selectedCar.description,
        dailyPrice: selectedCar.dailyPrice,

        isMonthlyAvailable: selectedCar.isMonthlyAvailable,
        monthlyPrice: selectedCar.isMonthlyAvailable
          ? Number(selectedCar.monthlyPrice || 0)
          : 0,

        images: Array.isArray(selectedCar.images) ? selectedCar.images : [],
        blockedDates: Array.isArray(selectedCar.blockedDates)
          ? selectedCar.blockedDates
          : [],

        features: {
          safety: stringToArray(arrayToCommaString(selectedCar.features?.safety)),
          tech: stringToArray(arrayToCommaString(selectedCar.features?.tech)),
          convenience: stringToArray(
            arrayToCommaString(selectedCar.features?.convenience)
          ),
          defects: stringToArray(arrayToCommaString(selectedCar.features?.defects)),
        },

        adminNotes: adminNotes.trim(),
        featuredSectionTitle: safeFeaturedTitle,
        featuredSectionKey: slugify(safeFeaturedTitle),
        isFeatured: Boolean(safeFeaturedTitle),
        featuredSection: safeFeaturedTitle,
      };

      const res = await fetch(`${API_URL}/cars/${selectedCar._id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to review car");
      }

      setReviewCars((prev) => prev.filter((car) => car._id !== selectedCar._id));

      if (action === "approve") {
        setMessage("Car approved and published successfully");
      } else if (action === "changes_requested") {
        setMessage("Changes requested sent back to host");
      } else {
        setMessage("Car rejected successfully");
      }

      closeReview();
      fetchPublishedCars();
    } catch (err) {
      setError(err.message || "Failed to review car");
    } finally {
      setReviewLoading(false);
    }
  };

  const openSectionEditor = (section) => {
    if (!canManageFeaturedCards) return;

    setActiveSectionEditor(section);
    setSectionEditorTitle(section.title);
    setOpenPanels((prev) => ({
      ...prev,
      featuredSections: true,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const closeSectionEditor = () => {
    setActiveSectionEditor(null);
    setSectionEditorTitle("");
    closeFeaturedCarEditor();
  };

  const openFeaturedCarEditor = async (car) => {
    if (!canManageFeaturedCards) return;
    if (!car?._id) return;

    try {
      setOpeningFeaturedCarId(car._id);
      setError("");
      setMessage("");

      const res = await fetch(`${API_URL}/cars/${car._id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to load full car details");
      }

      const fullCar = {
        ...car,
        ...data,
        owner: data.owner || car.owner,
      };

      setEditingFeaturedCar(fullCar);
      setFeaturedCarForm(getFeaturedCarForm(fullCar));
      setFeaturedDateMode("blocked");
      setFeaturedCalendarMonth(() => {
        const firstSavedDate = [
          ...(Array.isArray(fullCar.blockedDates) ? fullCar.blockedDates : []),
          ...(Array.isArray(fullCar.freeDates) ? fullCar.freeDates : []),
        ][0];

        if (firstSavedDate) {
          const date = new Date(firstSavedDate);
          if (!Number.isNaN(date.getTime())) {
            return new Date(date.getFullYear(), date.getMonth(), 1);
          }
        }

        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
      });
    } catch (err) {
      setError(err.message || "Failed to load full car details");
    } finally {
      setOpeningFeaturedCarId("");
    }
  };

  const closeFeaturedCarEditor = () => {
    setEditingFeaturedCar(null);
    setFeaturedCarForm(emptyFeaturedCarForm);
    setSavingFeaturedCar(false);
    setOpeningFeaturedCarId("");
  };

  const handleFeaturedCarFormChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFeaturedCarForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setFeaturedCarListingType = (listingType) => {
    setFeaturedCarForm((prev) => ({
      ...prev,
      isCityListing: listingType === "city",
      isAirportListing: listingType === "airport",
      city: listingType === "city" ? prev.city : "",
      airport: listingType === "airport" ? prev.airport : "",
    }));
  };

  const goPrevFeaturedMonth = () => {
    setFeaturedCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goNextFeaturedMonth = () => {
    setFeaturedCalendarMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const toggleFeaturedDate = (dateObj) => {
    if (!dateObj) return;

    const formatted = formatLocalDate(dateObj);
    const targetKey =
      featuredDateMode === "free" ? "freeDatesText" : "blockedDatesText";
    const oppositeKey =
      featuredDateMode === "free" ? "blockedDatesText" : "freeDatesText";

    setFeaturedCarForm((prev) => {
      const currentDates = stringToArray(prev[targetKey]);
      const oppositeDates = stringToArray(prev[oppositeKey]);
      const nextCurrentDates = currentDates.includes(formatted)
        ? currentDates.filter((item) => item !== formatted)
        : [...currentDates, formatted];

      return {
        ...prev,
        [targetKey]: nextCurrentDates.sort().join(", "),
        [oppositeKey]: oppositeDates
          .filter((item) => item !== formatted)
          .sort()
          .join(", "),
      };
    });
  };

  const handleSaveFeaturedCar = async (e) => {
    e.preventDefault();
    if (!editingFeaturedCar?._id) return;

    const safeFeaturedTitle =
      featuredCarForm.featuredSectionTitle.trim() ||
      editingFeaturedCar.featuredSectionTitle ||
      editingFeaturedCar.featuredSection ||
      getDefaultFeaturedSectionTitle(editingFeaturedCar);
    const safeImages = lineStringToArray(featuredCarForm.imagesText);

    if (!featuredCarForm.title.trim()) {
      setError("Car title is required");
      return;
    }

    if (!featuredCarForm.brand.trim() || !featuredCarForm.model.trim()) {
      setError("Brand and model are required");
      return;
    }

    if (!featuredCarForm.isCityListing && !featuredCarForm.isAirportListing) {
      setError("Choose city or airport listing");
      return;
    }

    if (featuredCarForm.isCityListing && !featuredCarForm.city.trim()) {
      setError("City is required for city listings");
      return;
    }

    if (featuredCarForm.isAirportListing && !featuredCarForm.airport.trim()) {
      setError("Airport is required for airport listings");
      return;
    }

    if (safeImages.length < 3) {
      setError("Keep at least 3 image URLs so the listing does not lose photos");
      return;
    }

    try {
      setSavingFeaturedCar(true);
      setMessage("");
      setError("");

      const payload = {
        action: "approve",
        title: featuredCarForm.title.trim(),
        brand: featuredCarForm.brand.trim(),
        model: featuredCarForm.model.trim(),
        year: Number(featuredCarForm.year || 0),
        type: featuredCarForm.type.trim(),
        transmission: featuredCarForm.transmission.trim(),
        fuelType: featuredCarForm.fuelType.trim(),
        seats: Number(featuredCarForm.seats || 0),

        isCityListing: featuredCarForm.isCityListing,
        city: featuredCarForm.isCityListing ? featuredCarForm.city.trim() : "",

        isAirportListing: featuredCarForm.isAirportListing,
        airport: featuredCarForm.isAirportListing
          ? featuredCarForm.airport.trim()
          : "",
        deliveryAirports: stringToArray(featuredCarForm.deliveryAirportsText),

        location: featuredCarForm.location.trim(),
        googleMapsUrl: featuredCarForm.googleMapsUrl.trim(),
        description: featuredCarForm.description.trim(),
        dailyPrice: Number(featuredCarForm.dailyPrice || 0),

        isMonthlyAvailable: featuredCarForm.isMonthlyAvailable,
        monthlyPrice: featuredCarForm.isMonthlyAvailable
          ? Number(featuredCarForm.monthlyPrice || 0)
          : 0,

        hostPhone: featuredCarForm.hostPhone.trim(),
        images: safeImages,
        blockedDates: stringToArray(featuredCarForm.blockedDatesText),
        freeDates: stringToArray(featuredCarForm.freeDatesText),

        features: {
          safety: stringToArray(featuredCarForm.safety),
          tech: stringToArray(featuredCarForm.tech),
          convenience: stringToArray(featuredCarForm.convenience),
          defects: stringToArray(featuredCarForm.defects),
        },

        rating: Number(featuredCarForm.rating || 0),
        trips: Number(featuredCarForm.trips || 0),
        isAvailable: featuredCarForm.isAvailable,
        isFeatured: Boolean(safeFeaturedTitle),
        adminNotes: featuredCarForm.adminNotes.trim(),
        featuredSectionTitle: safeFeaturedTitle,
        featuredSectionKey: slugify(safeFeaturedTitle),
        featuredSection: safeFeaturedTitle,
      };

      const res = await fetch(`${API_URL}/cars/${editingFeaturedCar._id}/review`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to update featured card");
      }

      setAllPublishedCars((prev) =>
        prev.map((car) => (car._id === data._id ? data : car))
      );
      setEditingFeaturedCar(data);

      setActiveSectionEditor((prev) => {
        if (!prev) return prev;

        const hasEditedCar = prev.cars.some((car) => car._id === data._id);
        if (!hasEditedCar) return prev;

        const updatedSectionKey = slugify(
          data.featuredSectionTitle || data.featuredSection || ""
        );

        if (updatedSectionKey && updatedSectionKey !== prev.key) {
          const nextCars = prev.cars.filter((car) => car._id !== data._id);
          return nextCars.length
            ? { ...prev, cars: nextCars, count: nextCars.length }
            : null;
        }

        return {
          ...prev,
          cars: prev.cars.map((car) => (car._id === data._id ? data : car)),
        };
      });

      setSelectedCar((prev) => (prev?._id === data._id ? data : prev));
      await fetchPublishedCars();
      setMessage(`${data.title || "Featured card"} updated successfully`);
      closeFeaturedCarEditor();
    } catch (err) {
      setError(err.message || "Failed to update featured card");
    } finally {
      setSavingFeaturedCar(false);
    }
  };

  const handleSaveSectionEditor = async () => {
    if (!activeSectionEditor?.cars?.length) return;

    const safeTitle = sectionEditorTitle.trim();

    if (!safeTitle) {
      setError("Featured section title is required");
      return;
    }

    try {
      setSectionEditorSaving(true);
      setMessage("");
      setError("");

      await Promise.all(
        activeSectionEditor.cars.map((car) =>
          fetch(`${API_URL}/cars/${car._id}/review`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
              action: "approve",
              adminNotes: car.adminNotes || "",
              featuredSectionTitle: safeTitle,
              featuredSectionKey: slugify(safeTitle),
              isFeatured: true,
              featuredSection: safeTitle,
            }),
          }).then(async (res) => {
            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
              throw new Error(data.message || `Failed to update ${car.title}`);
            }

            return data;
          })
        )
      );

      await fetchPublishedCars();

      setMessage(
        `${activeSectionEditor.count} car(s) moved to "${safeTitle}" successfully`
      );
      closeSectionEditor();
    } catch (err) {
      setError(err.message || "Failed to update featured section");
    } finally {
      setSectionEditorSaving(false);
    }
  };

  const handleDeleteFeaturedCar = async (car) => {
    if (!car?._id) return;

    const confirmed = window.confirm(
      `Delete ${car.title || "this car"} from the featured section and the whole site?`
    );

    if (!confirmed) return;

    try {
      setDeletingFeaturedCarId(car._id);
      setMessage("");
      setError("");

      const res = await fetch(`${API_URL}/cars/${car._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete featured card");
      }

      setAllPublishedCars((prev) => prev.filter((item) => item._id !== car._id));
      setReviewCars((prev) => prev.filter((item) => item._id !== car._id));
      setSelectedCar((prev) => (prev?._id === car._id ? null : prev));
      setEditingFeaturedCar((prev) => (prev?._id === car._id ? null : prev));

      setActiveSectionEditor((prev) => {
        if (!prev) return null;

        const nextCars = prev.cars.filter((item) => item._id !== car._id);

        return nextCars.length
          ? { ...prev, cars: nextCars, count: nextCars.length }
          : null;
      });

      setMessage(`${car.title || "Featured card"} deleted successfully`);
    } catch (err) {
      setError(err.message || "Failed to delete featured card");
    } finally {
      setDeletingFeaturedCarId("");
    }
  };

  return (
    <section className="hostDashboardPage">
      <div className="hostDashboardCard hostDashboardCardWide">
        <h1>Admin panel</h1>
        <p className="hostPanelSubtext">
          Click a section to open it. You can create hosts, manage hosts, review
          cars, and {canManageFeaturedCards ? "edit live featured rows directly." : "see live featured rows."}
        </p>

        {message && <p className="hostSuccess">{message}</p>}
        {error && <p className="hostError">{error}</p>}

        <AccordionSection
          panelKey="createHost"
          title="Create host"
          subtitle="Open this when you want to add a new approved host account."
          isOpen={openPanels.createHost}
          onToggle={togglePanel}
        >
          <form onSubmit={handleCreateHost} className="hostCarForm">
            <input
              name="name"
              placeholder="Host full name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              name="email"
              placeholder="Host email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              name="password"
              type="password"
              placeholder="Host password"
              value={form.password}
              onChange={handleChange}
            />
            <input
              name="avatar"
              placeholder="Avatar URL (optional)"
              value={form.avatar}
              onChange={handleChange}
            />

            <div className="hostAvatarUploadBlock">
              <label className="hostPanelSubtext">
                Or upload host profile photo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
              />

              {avatarUploading && (
                <p className="hostMutedText">Uploading avatar preview...</p>
              )}

              {form.avatar && (
                <div className="hostAvatarPreviewBox">
                  <img
                    src={form.avatar}
                    alt="Host avatar preview"
                    className="hostMiniAvatar"
                  />
                  <button
                    type="button"
                    className="hostCancelBtn"
                    onClick={clearAvatar}
                  >
                    Remove avatar
                  </button>
                </div>
              )}
            </div>

            <button type="submit">Create host account</button>
          </form>

          {hosts.length > 0 && (
            <div className="hostCreatedList">
              <h3>Recently created hosts</h3>
              <div className="hostCreatedGrid">
                {hosts.map((host) => {
                  const avatar = getHostAvatar(host);

                  return (
                    <article key={host._id || host.email} className="hostCreatedCard">
                      <div className="hostCreatedTop">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={host.name}
                            className="hostMiniAvatar"
                          />
                        ) : (
                          <div className="hostMiniAvatar hostMiniAvatarFallback">
                            {getInitials(host.name)}
                          </div>
                        )}
                        <div>
                          <div className="hostCreatedName">{host.name}</div>
                          <div className="hostCreatedEmail">{host.email}</div>
                        </div>
                      </div>
                      <div className="hostCreatedRole">{host.role || "host"}</div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          panelKey="viewHosts"
          title="View hosts"
          subtitle="Open the full host list to edit accounts or delete a host and all of their cars."
          isOpen={openPanels.viewHosts}
          onToggle={togglePanel}
          badge={mergedHosts.length ? `${mergedHosts.length}` : null}
        >
          {loadingHosts ? (
            <p className="hostMutedText">Loading hosts...</p>
          ) : mergedHosts.length === 0 ? (
            <p className="hostMutedText">
              No hosts loaded yet. Newly created hosts will still appear here once
              the list refreshes.
            </p>
          ) : (
            <div className="hostCreatedGrid">
              {mergedHosts.map((host) => {
                const avatar = getHostAvatar(host);

                return (
                  <article key={host._id || host.email} className="hostCreatedCard">
                    <div className="hostCreatedTop">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={host.name}
                          className="hostMiniAvatar"
                        />
                      ) : (
                        <div className="hostMiniAvatar hostMiniAvatarFallback">
                          {getInitials(host.name)}
                        </div>
                      )}

                      <div>
                        <div className="hostCreatedName">
                          {host.name || "Unnamed host"}
                        </div>
                        <div className="hostCreatedEmail">
                          {host.email || "No email"}
                        </div>
                      </div>
                    </div>

                    <div className="hostCreatedRole">{host.role || "host"}</div>

                    {avatar ? (
                      <div className="hostPanelSubtext">Avatar saved</div>
                    ) : (
                      <div className="hostPanelSubtext">No avatar yet</div>
                    )}

                    <div
                      className="hostCarActions"
                      style={{ marginTop: "14px" }}
                    >
                      <button
                        type="button"
                        className="hostEditBtn"
                        onClick={() => openEditHost(host)}
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        className="hostDeleteBtn"
                        disabled={deletingHostId === host._id}
                        onClick={() => handleDeleteHost(host)}
                      >
                        {deletingHostId === host._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </AccordionSection>

        {editingHost && (
          <div className="adminReviewWrap">
            <h2>Edit host</h2>

            <div className="adminReviewGrid">
              <div className="adminPreviewColumn">
                <div className="adminPreviewBox">
                  <h3>Host preview</h3>

                  <div className="hostCreatedTop" style={{ marginBottom: "16px" }}>
                    {editForm.avatar ? (
                      <img
                        src={editForm.avatar}
                        alt={editForm.name || "Host"}
                        className="hostMiniAvatar"
                      />
                    ) : (
                      <div className="hostMiniAvatar hostMiniAvatarFallback">
                        {getInitials(editForm.name || "H")}
                      </div>
                    )}

                    <div>
                      <div className="hostCreatedName">
                        {editForm.name || "Unnamed host"}
                      </div>
                      <div className="hostCreatedEmail">
                        {editForm.email || "No email"}
                      </div>
                    </div>
                  </div>

                  <p><strong>Role:</strong> {editingHost.role || "host"}</p>
                  <p><strong>ID:</strong> {editingHost._id}</p>
                </div>
              </div>

              <div className="adminReviewForm">
                <form onSubmit={handleSaveHost} className="hostCarForm">
                  <div className="adminPreviewBox">
                    <h3>Edit host info</h3>

                    <input
                      name="name"
                      placeholder="Host full name"
                      value={editForm.name}
                      onChange={handleEditHostChange}
                    />

                    <input
                      name="email"
                      placeholder="Host email"
                      value={editForm.email}
                      onChange={handleEditHostChange}
                    />

                    <input
                      name="avatar"
                      placeholder="Avatar URL"
                      value={editForm.avatar}
                      onChange={handleEditHostChange}
                    />

                    <div className="hostAvatarUploadBlock">
                      <label className="hostPanelSubtext">
                        Or upload new host photo
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditAvatarFileChange}
                      />

                      {editAvatarUploading && (
                        <p className="hostMutedText">Uploading avatar preview...</p>
                      )}

                      {editForm.avatar && (
                        <div className="hostAvatarPreviewBox">
                          <img
                            src={editForm.avatar}
                            alt="Edit host avatar preview"
                            className="hostMiniAvatar"
                          />
                          <button
                            type="button"
                            className="hostCancelBtn"
                            onClick={clearEditAvatar}
                          >
                            Remove avatar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="adminReviewActions">
                    <button
                      type="submit"
                      className="hostEditBtn"
                      disabled={savingHost}
                    >
                      {savingHost ? "Saving..." : "Save changes"}
                    </button>

                    <button
                      type="button"
                      className="hostDeleteBtn"
                      disabled={deletingHostId === editingHost._id}
                      onClick={() => handleDeleteHost(editingHost)}
                    >
                      {deletingHostId === editingHost._id
                        ? "Deleting..."
                        : "Delete host"}
                    </button>

                    <button
                      type="button"
                      className="hostCancelBtn"
                      onClick={closeEditHost}
                    >
                      Close
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {activeSectionEditor && (
          <div className="adminReviewWrap">
            <h2>Edit live featured section</h2>

            <div className="adminReviewGrid">
              <div className="adminPreviewColumn">
                <div className="adminPreviewBox">
                  <h3>Section overview</h3>
                  <p><strong>Current title:</strong> {activeSectionEditor.title}</p>
                  <p><strong>Current key:</strong> {activeSectionEditor.key}</p>
                  <p><strong>Cars inside:</strong> {activeSectionEditor.count}</p>
                  <p>
                    Saving this editor renames the whole live row for every car in
                    this section.
                  </p>
                </div>

                <div className="adminPreviewBox">
                  <h3>Cars in this row</h3>
                  <div className="adminMiniList">
                    {activeSectionEditor.cars.map((car) => (
                      <article key={car._id} className="adminMiniListCard">
                        <div className="hostCreatedName">{car.title}</div>
                        <div className="hostCreatedEmail">
                          {car.year} - {car.type} - ${car.dailyPrice}/day
                        </div>
                        <div className="hostPanelSubtext">ssword
                          {car.owner?.name || "Unknown host"}
                        </div>
                        <div className="hostCarActions">
                          <button
                            type="button"
                            className="hostEditBtn"
                            disabled={openingFeaturedCarId === car._id}
                            onClick={() => openFeaturedCarEditor(car)}
                          >
                            {openingFeaturedCarId === car._id
                              ? "Loading..."
                              : "Edit card"}
                          </button>

                          <button
                            type="button"
                            className="hostDeleteBtn adminDeleteFeaturedCardBtn"
                            disabled={deletingFeaturedCarId === car._id}
                            onClick={() => handleDeleteFeaturedCar(car)}
                          >
                            {deletingFeaturedCarId === car._id
                              ? "Deleting..."
                              : "Delete card"}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </div>

              <div className="adminReviewForm">
                <div className="adminPreviewBox">
                  <h3>Rename section</h3>

                  <input
                    type="text"
                    value={sectionEditorTitle}
                    onChange={(e) => setSectionEditorTitle(e.target.value)}
                    placeholder="Featured section title"
                  />

                  <p>
                    <strong>New key:</strong>{" "}
                    {sectionEditorTitle.trim() ? slugify(sectionEditorTitle) : "-"}
                  </p>

                  <p className="hostPanelSubtext">
                    Admins can edit these live boxes. Saving updates every
                    published car inside this section.
                  </p>
                </div>

                <div className="adminReviewActions">
                  <button
                    type="button"
                    className="hostEditBtn"
                    disabled={sectionEditorSaving}
                    onClick={handleSaveSectionEditor}
                  >
                    {sectionEditorSaving ? "Saving..." : "Save section"}
                  </button>

                  <button
                    type="button"
                    className="hostCancelBtn"
                    onClick={closeSectionEditor}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

            {editingFeaturedCar && (
              <div className="adminFeaturedCarEditor">
                <h2>Edit live card</h2>
                <p className="hostPanelSubtext">
                  Review and correct what the host entered. Existing photos stay
                  saved unless you remove their URL from the image list.
                </p>

                <form onSubmit={handleSaveFeaturedCar} className="adminReviewForm">
                  <div className="adminReviewGrid">
                    <div className="adminPreviewColumn">
                      <div className="adminPreviewBox">
                        <h3>Host and photos</h3>

                        <div className="hostCreatedTop adminEditorHostRow">
                          {getHostAvatar(editingFeaturedCar.owner) ? (
                            <img
                              src={getHostAvatar(editingFeaturedCar.owner)}
                              alt={editingFeaturedCar.owner?.name || "Host"}
                              className="hostMiniAvatar"
                            />
                          ) : (
                            <div className="hostMiniAvatar hostMiniAvatarFallback">
                              {getInitials(editingFeaturedCar.owner?.name || "H")}
                            </div>
                          )}

                          <div>
                            <div className="hostCreatedName">
                              {editingFeaturedCar.owner?.name || "Unknown host"}
                            </div>
                            <div className="hostCreatedEmail">
                              {editingFeaturedCar.owner?.email || "No email"}
                            </div>
                          </div>
                        </div>

                        <div className="adminImagePreviewGrid">
                          {lineStringToArray(featuredCarForm.imagesText).map(
                            (image, index) => (
                              <img
                                key={`${image}-${index}`}
                                src={image}
                                alt={`${featuredCarForm.title || "Car"} ${index + 1}`}
                              />
                            )
                          )}
                        </div>

                        <label className="hostPanelSubtext">
                          Image URLs, one per line
                        </label>
                        <textarea
                          name="imagesText"
                          value={featuredCarForm.imagesText}
                          onChange={handleFeaturedCarFormChange}
                          rows={6}
                        />
                      </div>

                      <div className="adminPreviewBox">
                        <h3>Features and dates</h3>
                        <input
                          name="safety"
                          placeholder="Safety features, comma separated"
                          value={featuredCarForm.safety}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="tech"
                          placeholder="Tech features, comma separated"
                          value={featuredCarForm.tech}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="convenience"
                          placeholder="Convenience features, comma separated"
                          value={featuredCarForm.convenience}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="defects"
                          placeholder="Known defects, comma separated"
                          value={featuredCarForm.defects}
                          onChange={handleFeaturedCarFormChange}
                        />

                        <div className="adminDateEditor">
                          <div className="hostBooleanRow">
                            <button
                              type="button"
                              className={`hostBoolBtn ${
                                featuredDateMode === "blocked" ? "active" : ""
                              }`}
                              onClick={() => setFeaturedDateMode("blocked")}
                            >
                              Blocked
                            </button>
                            <button
                              type="button"
                              className={`hostBoolBtn ${
                                featuredDateMode === "free" ? "active" : ""
                              }`}
                              onClick={() => setFeaturedDateMode("free")}
                            >
                              Free
                            </button>
                          </div>

                          <div className="hostCalendarHeader">
                            <button
                              type="button"
                              className="hostCalendarNav"
                              onClick={goPrevFeaturedMonth}
                            >
                              &lt;
                            </button>

                            <h3 className="hostCalendarTitle">
                              {featuredCalendarMonth.toLocaleString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </h3>

                            <button
                              type="button"
                              className="hostCalendarNav"
                              onClick={goNextFeaturedMonth}
                            >
                              &gt;
                            </button>
                          </div>

                          <div className="hostCalendarWeekdays">
                            <span>Mon</span>
                            <span>Tue</span>
                            <span>Wed</span>
                            <span>Thu</span>
                            <span>Fri</span>
                            <span>Sat</span>
                            <span>Sun</span>
                          </div>

                          <div className="hostCalendarGrid">
                            {featuredEditorMonthDays.map((dateObj, index) => {
                              if (!dateObj) {
                                return (
                                  <div
                                    key={`admin-empty-${index}`}
                                    className="hostCalendarEmpty"
                                  />
                                );
                              }

                              const formatted = formatLocalDate(dateObj);
                              const isBlocked = stringToArray(
                                featuredCarForm.blockedDatesText
                              ).includes(formatted);
                              const isFree = stringToArray(
                                featuredCarForm.freeDatesText
                              ).includes(formatted);

                              return (
                                <button
                                  key={formatted}
                                  type="button"
                                  className={`hostCalendarDay ${
                                    isBlocked ? "selected" : ""
                                  } ${isFree ? "adminFreeDate" : ""}`}
                                  onClick={() => toggleFeaturedDate(dateObj)}
                                  title={
                                    isBlocked
                                      ? "Blocked date"
                                      : isFree
                                      ? "Free date"
                                      : "Available date"
                                  }
                                >
                                  {dateObj.getDate()}
                                </button>
                              );
                            })}
                          </div>

                          <p className="hostPanelSubtext">
                            Choose Blocked or Free, then click dates. A date can
                            only be in one list at a time.
                          </p>
                        </div>

                        <input
                          name="blockedDatesText"
                          placeholder="Blocked dates, comma separated"
                          value={featuredCarForm.blockedDatesText}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="freeDatesText"
                          placeholder="Free dates, comma separated"
                          value={featuredCarForm.freeDatesText}
                          onChange={handleFeaturedCarFormChange}
                        />
                      </div>
                    </div>

                    <div className="adminPreviewColumn">
                      <div className="adminPreviewBox">
                        <h3>Main details</h3>
                        <input
                          name="title"
                          placeholder="Title"
                          value={featuredCarForm.title}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="brand"
                          placeholder="Brand"
                          value={featuredCarForm.brand}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="model"
                          placeholder="Model"
                          value={featuredCarForm.model}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="year"
                          type="number"
                          placeholder="Year"
                          value={featuredCarForm.year}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="type"
                          placeholder="Type"
                          value={featuredCarForm.type}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="transmission"
                          placeholder="Transmission"
                          value={featuredCarForm.transmission}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="fuelType"
                          placeholder="Fuel type"
                          value={featuredCarForm.fuelType}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="seats"
                          type="number"
                          placeholder="Seats"
                          value={featuredCarForm.seats}
                          onChange={handleFeaturedCarFormChange}
                        />
                      </div>

                      <div className="adminPreviewBox">
                        <h3>Location and pricing</h3>

                        <div className="hostBooleanRow">
                          <button
                            type="button"
                            className={`hostBoolBtn ${
                              featuredCarForm.isCityListing ? "active" : ""
                            }`}
                            onClick={() => setFeaturedCarListingType("city")}
                          >
                            City
                          </button>
                          <button
                            type="button"
                            className={`hostBoolBtn ${
                              featuredCarForm.isAirportListing ? "active" : ""
                            }`}
                            onClick={() => setFeaturedCarListingType("airport")}
                          >
                            Airport
                          </button>
                        </div>

                        {featuredCarForm.isCityListing ? (
                          <input
                            name="city"
                            placeholder="City"
                            value={featuredCarForm.city}
                            onChange={handleFeaturedCarFormChange}
                          />
                        ) : (
                          <input
                            name="airport"
                            placeholder="Airport code or name"
                            value={featuredCarForm.airport}
                            onChange={handleFeaturedCarFormChange}
                          />
                        )}

                        <input
                          name="deliveryAirportsText"
                          placeholder="Delivery airports, comma separated"
                          value={featuredCarForm.deliveryAirportsText}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="location"
                          placeholder="Location"
                          value={featuredCarForm.location}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="googleMapsUrl"
                          placeholder="Google Maps URL"
                          value={featuredCarForm.googleMapsUrl}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="dailyPrice"
                          type="number"
                          placeholder="Daily price"
                          value={featuredCarForm.dailyPrice}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <label className="adminCheckRow">
                          <input
                            name="isMonthlyAvailable"
                            type="checkbox"
                            checked={featuredCarForm.isMonthlyAvailable}
                            onChange={handleFeaturedCarFormChange}
                          />
                          Monthly rental available
                        </label>
                        <input
                          name="monthlyPrice"
                          type="number"
                          placeholder="Monthly price"
                          value={featuredCarForm.monthlyPrice}
                          onChange={handleFeaturedCarFormChange}
                        />
                      </div>

                      <div className="adminPreviewBox">
                        <h3>Admin fields</h3>
                        <input
                          name="featuredSectionTitle"
                          placeholder="Featured section title"
                          value={featuredCarForm.featuredSectionTitle}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="hostPhone"
                          placeholder="Host phone"
                          value={featuredCarForm.hostPhone}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="rating"
                          type="number"
                          step="0.1"
                          placeholder="Rating"
                          value={featuredCarForm.rating}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <input
                          name="trips"
                          type="number"
                          placeholder="Trips"
                          value={featuredCarForm.trips}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <label className="adminCheckRow">
                          <input
                            name="isAvailable"
                            type="checkbox"
                            checked={featuredCarForm.isAvailable}
                            onChange={handleFeaturedCarFormChange}
                          />
                          Available on site
                        </label>
                        <textarea
                          name="description"
                          placeholder="Description"
                          value={featuredCarForm.description}
                          onChange={handleFeaturedCarFormChange}
                        />
                        <textarea
                          name="adminNotes"
                          placeholder="Admin notes for host"
                          value={featuredCarForm.adminNotes}
                          onChange={handleFeaturedCarFormChange}
                        />
                      </div>

                      <div className="adminReviewActions">
                        <button
                          type="submit"
                          className="hostEditBtn"
                          disabled={savingFeaturedCar}
                        >
                          {savingFeaturedCar ? "Saving..." : "Save card updates"}
                        </button>
                        <button
                          type="button"
                          className="hostCancelBtn"
                          onClick={closeFeaturedCarEditor}
                        >
                          Close card editor
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        <AccordionSection
          panelKey="featuredSections"
          title="Live featured sections"
          subtitle={
            canManageFeaturedCards
              ? "These boxes are clickable. Open one to rename that live homepage row or delete its cards."
              : "These boxes show how many approved cars are inside each live homepage row."
          }
          isOpen={openPanels.featuredSections}
          onToggle={togglePanel}
          badge={existingSections.length ? `${existingSections.length}` : null}
        >
          {loadingPublishedCars ? (
            <p className="hostMutedText">Loading featured sections...</p>
          ) : existingSections.length === 0 ? (
            <p className="hostMutedText">No featured sections created yet.</p>
          ) : (
            <div className="hostCreatedGrid">
              {existingSections.map((section) => (
                <article
                  key={section.key}
                  className={`hostCreatedCard ${canManageFeaturedCards ? "adminClickableCard" : ""}`}
                  onClick={() => openSectionEditor(section)}
                >
                  <div className="hostCreatedName">{section.title}</div>
                  <div className="hostCreatedEmail">key: {section.key}</div>
                  <div className="hostCreatedRole">{section.count} car(s)</div>
                  <div className="hostPanelSubtext">
                    {canManageFeaturedCards ? "Click to edit cards" : "View only"}
                  </div>
                </article>
              ))}
            </div>
          )}
        </AccordionSection>

        <AccordionSection
          panelKey="reviewCars"
          title="Cars waiting for approval"
          subtitle="Open this queue to review pending host submissions and choose their featured section."
          isOpen={openPanels.reviewCars}
          onToggle={togglePanel}
          badge={reviewCars.length ? `${reviewCars.length}` : null}
        >

          {loadingReviewCars ? (
            <p className="hostMutedText">Loading review cars...</p>
          ) : reviewCars.length === 0 ? (
            <p className="hostMutedText">No pending cars for review.</p>
          ) : (
            <div className="hostCarsGrid">
              {reviewCars.map((car) => {
                const suggested = getDefaultFeaturedSectionTitle(car);
                const ownerAvatar = getHostAvatar(car.owner);

                return (
                  <article key={car._id} className="hostCarCard">
                    <div className="hostCarImageWrap">
                      <img
                        src={
                          car.images?.[0] ||
                          "https://via.placeholder.com/600x400?text=Veturo"
                        }
                        alt={car.title}
                      />
                    </div>

                    <div className="hostCarInfo">
                      <div className="hostStatusBadge hostStatusBadgePending">
                        {car.approvalStatus || "pending"}
                      </div>

                      <h3>{car.title}</h3>
                      <p>
                        {car.year} • {car.type} • {car.transmission}
                      </p>
                      <p>{car.location || car.city || car.airport}</p>

                      <div className="hostCreatedTop" style={{ marginTop: "10px" }}>
                        {ownerAvatar ? (
                          <img
                            src={ownerAvatar}
                            alt={car.owner?.name || "Host"}
                            className="hostMiniAvatar"
                          />
                        ) : (
                          <div className="hostMiniAvatar hostMiniAvatarFallback">
                            {getInitials(car.owner?.name || "H")}
                          </div>
                        )}

                        <div>
                          <p style={{ margin: 0 }}>
                            Host name: <strong>{car.owner?.name || "Unknown"}</strong>
                          </p>
                          <p style={{ margin: 0 }}>
                            Host email:{" "}
                            <strong>{car.owner?.email || "No email"}</strong>
                          </p>
                        </div>
                      </div>

                      <p>
                        Suggested section: <strong>{suggested}</strong>
                      </p>
                      <strong>${car.dailyPrice}/day</strong>

                      <div className="hostCarActions">
                        <button
                          type="button"
                          className="hostEditBtn"
                          onClick={() => openReview(car)}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </AccordionSection>

        {selectedCar && previewData && (
          <div className="adminReviewWrap">
            <h2>Review car before publish</h2>

            <div className="adminReviewGrid">
              <div className="adminPreviewColumn">
                <div className="adminPreviewBox">
                  <h3>Card preview</h3>

                  <article className="card adminPreviewCardStatic">
                    <div className="card__imageWrap">
                      <img
                        src={
                          previewData.images?.[0] ||
                          "https://via.placeholder.com/600x400?text=Veturo"
                        }
                        alt={previewData.title}
                      />

                      <div className="card__overlayTop">
                        <span className="card__badge">
                          {previewData.airport || previewData.city || "Veturo"}
                        </span>
                      </div>

                      <div className="card__overlayBottom">
                        <span className="card__saveOverlay">
                          {previewData.blockedDates?.length || 0} blocked dates
                        </span>
                      </div>
                    </div>

                    <div className="card__info">
                      <h3 className="card__title">{previewData.title}</h3>

                      <div className="card__subline">
                        <span className="card__year">{previewData.year}</span>
                        <span className="card__dot">•</span>
                        <span className="card__type">{previewData.type}</span>
                      </div>

                      <div className="card__metaRow">
                        <span className="card__rating">
                          ★ {previewData.rating || 0}
                        </span>
                        <span className="card__trips">
                          {previewData.trips || 0} trips
                        </span>
                      </div>

                      <div className="card__bottom">
                        <div className="card__priceWrap">
                          <span className="card__price">
                            ${previewData.dailyPrice}
                          </span>
                          <span className="card__days"> / day</span>
                        </div>
                      </div>
                    </div>
                  </article>
                </div>

                <div className="adminPreviewBox">
                  <h3>Car details preview</h3>

                  <div className="hostCreatedTop" style={{ marginBottom: "12px" }}>
                    {getHostAvatar(previewData.owner) ? (
                      <img
                        src={getHostAvatar(previewData.owner)}
                        alt={previewData.owner?.name || "Host"}
                        className="hostMiniAvatar"
                      />
                    ) : (
                      <div className="hostMiniAvatar hostMiniAvatarFallback">
                        {getInitials(previewData.owner?.name || "H")}
                      </div>
                    )}

                    <div>
                      <p style={{ margin: 0 }}>
                        <strong>Host:</strong>{" "}
                        {previewData.owner?.name || "Unknown host"}
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Host email:</strong>{" "}
                        {previewData.owner?.email || "No email"}
                      </p>
                    </div>
                  </div>

                  <p><strong>Title:</strong> {previewData.title}</p>
                  <p><strong>Brand:</strong> {previewData.brand}</p>
                  <p><strong>Model:</strong> {previewData.model}</p>
                  <p><strong>Year:</strong> {previewData.year}</p>
                  <p><strong>Type:</strong> {previewData.type}</p>
                  <p><strong>Transmission:</strong> {previewData.transmission}</p>
                  <p><strong>Fuel:</strong> {previewData.fuelType}</p>
                  <p><strong>Seats:</strong> {previewData.seats}</p>
                  <p><strong>Location:</strong> {previewData.location}</p>
                  <p><strong>Description:</strong> {previewData.description}</p>
                  <p><strong>Safety:</strong> {previewData.safetyText || "—"}</p>
                  <p><strong>Tech:</strong> {previewData.techText || "—"}</p>
                  <p>
                    <strong>Convenience:</strong>{" "}
                    {previewData.convenienceText || "—"}
                  </p>
                  <p><strong>Defects:</strong> {previewData.defectsText || "—"}</p>
                </div>
              </div>

              <div className="adminReviewForm">
                <div className="adminPreviewBox">
                  <h3>Choose featured section</h3>

                  <p>
                    <strong>Suggested:</strong>{" "}
                    {suggestedSectionTitle || "No suggestion"}
                  </p>

                  <select
                    value={selectedExistingSection}
                    onChange={(e) => setSelectedExistingSection(e.target.value)}
                  >
                    <option value="">Select existing featured section</option>
                    {existingSections.map((section) => (
                      <option key={section.key} value={section.title}>
                        {section.title}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Or create a new featured section title"
                    value={newFeaturedTitle}
                    onChange={(e) => setNewFeaturedTitle(e.target.value)}
                  />

                  <p className="hostPanelSubtext">
                    Admin rule: if you type a new title, that one wins. If not,
                    selected existing section is used. If nothing is selected,
                    suggested section is used.
                  </p>
                </div>

                <textarea
                  placeholder="Admin notes for host"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />

                <div className="adminPreviewBox">
                  <h3>Featured section result</h3>
                  <p>
                    <strong>Final h2 title:</strong>{" "}
                    {finalFeaturedTitle || "No featured section selected"}
                  </p>
                  <p>
                    <strong>Key:</strong>{" "}
                    {finalFeaturedTitle ? slugify(finalFeaturedTitle) : "—"}
                  </p>
                  <p>
                    If this title already exists, the card goes into that row.
                    If not, a new featured section h2 is created.
                  </p>
                </div>

                <div className="adminReviewActions">
                  <button
                    type="button"
                    className="hostEditBtn"
                    disabled={reviewLoading}
                    onClick={() => handleReviewAction("approve")}
                  >
                    Approve & publish
                  </button>

                  <button
                    type="button"
                    className="hostCancelBtn"
                    disabled={reviewLoading}
                    onClick={() => handleReviewAction("changes_requested")}
                  >
                    Request changes
                  </button>

                  <button
                    type="button"
                    className="hostDeleteBtn"
                    disabled={reviewLoading}
                    onClick={() => handleReviewAction("reject")}
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    className="hostCancelBtn"
                    onClick={closeReview}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
