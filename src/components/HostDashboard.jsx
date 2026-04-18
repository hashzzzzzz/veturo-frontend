import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./host.css";

import API_URL from "../config/api";

const initialFormState = {
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

  location: "",
  googleMapsUrl: "",

  description: "",
  dailyPrice: "",

  isMonthlyAvailable: false,
  monthlyPrice: "",

  hostPhone: "",

  safety: "",
  tech: "",
  convenience: "",
  defects: "",
};

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

function arrayToCommaString(value) {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

function getStatusText(car) {
  if (car.approvalStatus === "approved" && car.isPublished) {
    return "Approved & live";
  }

  if (car.approvalStatus === "changes_requested") {
    return "Changes requested";
  }

  if (car.approvalStatus === "rejected") {
    return "Rejected";
  }

  return "Pending review";
}

function getOptimizedCardImage(imageUrl = "") {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "https://via.placeholder.com/600x400?text=Veturo";
  }

  if (imageUrl.includes("res.cloudinary.com") && imageUrl.includes("/upload/")) {
    return imageUrl.replace(
      "/upload/",
      "/upload/f_auto,q_auto,w_700,h_450,c_fill/"
    );
  }

  return imageUrl;
}

export default function HostDashboard() {
  const hostToken = localStorage.getItem("hostToken");
  const hostUser = JSON.parse(localStorage.getItem("hostUser") || "null");
  const navigate = useNavigate();

  const [form, setForm] = useState(initialFormState);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [myCars, setMyCars] = useState([]);
  const [loadingCars, setLoadingCars] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editingCarId, setEditingCarId] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const [blockedDates, setBlockedDates] = useState([]);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    if (!hostToken || !hostUser) {
      navigate("/hosts");
      return;
    }

    if (!["host", "admin", "superadmin"].includes(hostUser.role)) {
      navigate("/hosts");
      return;
    }

    fetchMyCars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyCars = async () => {
    try {
      setLoadingCars(true);
      setError("");

      if (!hostUser?._id) {
        setLoadingCars(false);
        return;
      }

      const res = await fetch(`${API_URL}/cars/host/${hostUser._id}`, {
        headers: {
          Authorization: `Bearer ${hostToken}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch host cars");
      }

      setMyCars(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to fetch host cars");
    } finally {
      setLoadingCars(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setBooleanField = (name, value) => {
    if (name === "isCityListing") {
      setForm((prev) => ({
        ...prev,
        isCityListing: value,
        isAirportListing: value ? false : prev.isAirportListing,
        ...(value ? { airport: "" } : {}),
        ...(!value ? { city: "" } : {}),
      }));
      return;
    }

    if (name === "isAirportListing") {
      setForm((prev) => ({
        ...prev,
        isAirportListing: value,
        isCityListing: value ? false : prev.isCityListing,
        ...(value ? { city: "" } : {}),
        ...(!value ? { airport: "" } : {}),
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "isMonthlyAvailable" && !value ? { monthlyPrice: "" } : {}),
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setEditingCarId(null);
    setExistingImages([]);
    setImageFiles([]);
    setNewImagePreviews([]);
    setBlockedDates([]);
    setMessage("");
    setError("");

    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const startEditingCar = (car) => {
    setMessage("");
    setError("");
    setEditingCarId(car._id);

    setForm({
      title: car.title || "",
      brand: car.brand || "",
      model: car.model || "",
      year: car.year ? String(car.year) : "",
      type: car.type || "",
      transmission: car.transmission || "",
      fuelType: car.fuelType || "",
      seats: car.seats ? String(car.seats) : "",

      isCityListing: Boolean(car.isCityListing),
      city: car.city || "",

      isAirportListing: Boolean(car.isAirportListing),
      airport: car.airport || "",

      location: car.location || "",
      googleMapsUrl: car.googleMapsUrl || "",

      description: car.description || "",
      dailyPrice: car.dailyPrice ? String(car.dailyPrice) : "",

      isMonthlyAvailable: Boolean(car.isMonthlyAvailable),
      monthlyPrice: car.monthlyPrice ? String(car.monthlyPrice) : "",

      hostPhone: car.hostPhone || hostUser?.phone || "",

      safety: arrayToCommaString(car.features?.safety),
      tech: arrayToCommaString(car.features?.tech),
      convenience: arrayToCommaString(car.features?.convenience),
      defects: arrayToCommaString(car.features?.defects),
    });

    setExistingImages(Array.isArray(car.images) ? car.images : []);
    setImageFiles([]);
    setNewImagePreviews([]);
    setBlockedDates(Array.isArray(car.blockedDates) ? car.blockedDates : []);

    const now = new Date();
    setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEditing = () => {
    resetForm();
  };

  const handleFiles = (filesList) => {
    const files = Array.from(filesList || []).filter((file) =>
      file.type.startsWith("image/")
    );

    if (!files.length) return;

    const totalImagesCount =
      existingImages.length + imageFiles.length + files.length;

    if (totalImagesCount > 6) {
      setError("You can upload maximum 6 photos.");
      return;
    }

    setError("");
    setImageFiles((prev) => [...prev, ...files]);

    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleImageInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeExistingImage = (indexToRemove) => {
    setExistingImages((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const removeNewImage = (indexToRemove) => {
    setImageFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
    setNewImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const goPrevMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const toggleBlockedDate = (dateObj) => {
    if (!dateObj) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clickedDate = new Date(dateObj);
    clickedDate.setHours(0, 0, 0, 0);

    if (clickedDate < today) return;

    const formatted = formatLocalDate(dateObj);

    setBlockedDates((prev) =>
      prev.includes(formatted)
        ? prev.filter((item) => item !== formatted)
        : [...prev, formatted].sort()
    );
  };

  const monthDays = useMemo(() => getMonthDays(calendarMonth), [calendarMonth]);

  const validateForm = () => {
    if (!form.title.trim()) {
      setError("Title is required.");
      return false;
    }

    if (!form.brand.trim()) {
      setError("Brand is required.");
      return false;
    }

    if (!form.model.trim()) {
      setError("Model is required.");
      return false;
    }

    if (!form.year || Number(form.year) < 1900) {
      setError("Please enter a valid year.");
      return false;
    }

    if (!form.type.trim()) {
      setError("Type is required.");
      return false;
    }

    if (!form.transmission.trim()) {
      setError("Transmission is required.");
      return false;
    }

    if (!form.fuelType.trim()) {
      setError("Fuel type is required.");
      return false;
    }

    if (!form.seats || Number(form.seats) <= 0) {
      setError("Please enter valid seats.");
      return false;
    }

    if (!form.isCityListing && !form.isAirportListing) {
      setError("Select city or airport.");
      return false;
    }

    if (form.isCityListing && form.isAirportListing) {
      setError("Choose only one: city or airport.");
      return false;
    }

    if (form.isCityListing && !form.city.trim()) {
      setError("Please choose or enter a city.");
      return false;
    }

    if (form.isAirportListing && !form.airport) {
      setError("Please choose an airport.");
      return false;
    }

    if (!form.location.trim()) {
      setError("Location is required.");
      return false;
    }

    if (!form.description.trim()) {
      setError("Description is required.");
      return false;
    }

    if (!form.dailyPrice || Number(form.dailyPrice) <= 0) {
      setError("Please enter a valid daily price.");
      return false;
    }

    if (
      form.isMonthlyAvailable &&
      (!form.monthlyPrice || Number(form.monthlyPrice) <= 0)
    ) {
      setError("Please enter a valid monthly price.");
      return false;
    }

    const totalImagesCount = existingImages.length + imageFiles.length;

    if (totalImagesCount < 3) {
      setError("Please upload at least 3 photos.");
      return false;
    }

    if (totalImagesCount > 6) {
      setError("Maximum 6 photos allowed.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setMessage("");
      setError("");

      if (!validateForm()) {
        return;
      }

      const isEditing = Boolean(editingCarId);
      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("brand", form.brand.trim());
      formData.append("model", form.model.trim());
      formData.append("year", form.year);
      formData.append("type", form.type.trim());
      formData.append("transmission", form.transmission.trim());
      formData.append("fuelType", form.fuelType.trim());
      formData.append("seats", form.seats);

      formData.append("isCityListing", String(form.isCityListing));
      formData.append("city", form.isCityListing ? form.city.trim() : "");

      formData.append("isAirportListing", String(form.isAirportListing));
      formData.append("airport", form.isAirportListing ? form.airport : "");

      formData.append("location", form.location.trim());
      formData.append("googleMapsUrl", form.googleMapsUrl.trim());
      formData.append("description", form.description.trim());
      formData.append("dailyPrice", form.dailyPrice);

      formData.append("isMonthlyAvailable", String(form.isMonthlyAvailable));
      formData.append(
        "monthlyPrice",
        form.isMonthlyAvailable ? String(Number(form.monthlyPrice || 0)) : "0"
      );

      formData.append("hostPhone", form.hostPhone.trim() || hostUser?.phone || "");
      formData.append("existingImages", JSON.stringify(existingImages));

      formData.append(
        "features",
        JSON.stringify({
          safety: form.safety
            ? form.safety.split(",").map((x) => x.trim()).filter(Boolean)
            : [],
          tech: form.tech
            ? form.tech.split(",").map((x) => x.trim()).filter(Boolean)
            : [],
          convenience: form.convenience
            ? form.convenience.split(",").map((x) => x.trim()).filter(Boolean)
            : [],
          defects: form.defects
            ? form.defects.split(",").map((x) => x.trim()).filter(Boolean)
            : [],
        })
      );

      formData.append("blockedDates", JSON.stringify(blockedDates));

      imageFiles.forEach((file) => {
        formData.append("images", file);
      });

      const res = await fetch(
        isEditing ? `${API_URL}/cars/${editingCarId}` : `${API_URL}/cars`,
        {
          method: isEditing ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${hostToken}`,
          },
          body: formData,
        }
      );

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        console.error("CREATE/UPDATE CAR RESPONSE:", data);

        const backendMessage =
          data?.message ||
          data?.error ||
          (isEditing ? "Failed to update car" : "Failed to create car");

        throw new Error(backendMessage);
      }

      if (isEditing) {
        setMyCars((prev) =>
          prev.map((car) => (car._id === editingCarId ? data : car))
        );
        setMessage("Car updated and sent to superadmin review.");
      } else {
        setMyCars((prev) => [data, ...prev]);
        setMessage("Car submitted successfully. Waiting for superadmin approval.");
      }

      setForm(initialFormState);
      setEditingCarId(null);
      setExistingImages([]);
      setImageFiles([]);
      setNewImagePreviews([]);
      setBlockedDates([]);
    } catch (err) {
      console.error("HOST DASHBOARD SUBMIT ERROR:", err);
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCar = async (car) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${car.title}?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const res = await fetch(`${API_URL}/cars/${car._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${hostToken}`,
        },
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete car");
      }

      setMyCars((prev) => prev.filter((item) => item._id !== car._id));

      if (editingCarId === car._id) {
        resetForm();
      }

      setMessage(`${car.title} deleted successfully`);
    } catch (err) {
      setError(err.message || "Failed to delete car");
    }
  };

  return (
    <section className="hostDashboardPage">
      <div className="hostDashboardCard">
        <h1>{editingCarId ? "Update your car" : "Add a new car"}</h1>
        <p className="hostPanelSubtext">
          {editingCarId
            ? "Edit your existing Veturo listing. After update it goes back to superadmin review."
            : "Submit your car to Veturo. Superadmin reviews it before it goes live."}
        </p>

        <form onSubmit={handleSubmit} className="hostCarForm">
          <input
            name="title"
            placeholder="Title"
            value={form.title}
            onChange={handleChange}
          />
          <input
            name="brand"
            placeholder="Brand"
            value={form.brand}
            onChange={handleChange}
          />
          <input
            name="model"
            placeholder="Model"
            value={form.model}
            onChange={handleChange}
          />
          <input
            name="year"
            placeholder="Year"
            value={form.year}
            onChange={handleChange}
          />
          <input
            name="type"
            placeholder="Type"
            value={form.type}
            onChange={handleChange}
          />
          <input
            name="transmission"
            placeholder="Transmission"
            value={form.transmission}
            onChange={handleChange}
          />
          <input
            name="fuelType"
            placeholder="Fuel type"
            value={form.fuelType}
            onChange={handleChange}
          />
          <input
            name="seats"
            placeholder="Seats"
            value={form.seats}
            onChange={handleChange}
          />

          <div className="hostQuestionBlock">
            <label className="hostUploadLabel">List this car in a city?</label>
            <div className="hostBooleanRow">
              <button
                type="button"
                className={form.isCityListing ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isCityListing", true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={!form.isCityListing ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isCityListing", false)}
              >
                No
              </button>
            </div>

            {form.isCityListing && (
              <input
                name="city"
                placeholder="Which city? Example: Ferizaj"
                value={form.city}
                onChange={handleChange}
              />
            )}
          </div>

          <div className="hostQuestionBlock">
            <label className="hostUploadLabel">List this car at an airport?</label>
            <div className="hostBooleanRow">
              <button
                type="button"
                className={form.isAirportListing ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isAirportListing", true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={!form.isAirportListing ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isAirportListing", false)}
              >
                No
              </button>
            </div>

            {form.isAirportListing && (
              <select
                name="airport"
                value={form.airport}
                onChange={handleChange}
                className="hostSelect"
              >
                <option value="">Choose airport</option>
                <option value="PRN">Pristina Airport (PRN)</option>
                <option value="TIA">Tirana Airport (TIA)</option>
                <option value="SKP">Skopje Airport (SKP)</option>
              </select>
            )}
          </div>

          <input
            name="location"
            placeholder="Location text. Example: Rruga 12 Qershori, Ferizaj"
            value={form.location}
            onChange={handleChange}
          />

          <input
            name="googleMapsUrl"
            placeholder="Google Maps link (optional)"
            value={form.googleMapsUrl}
            onChange={handleChange}
          />

          <textarea
            name="description"
            placeholder="About this car"
            value={form.description}
            onChange={handleChange}
          />

          <input
            name="dailyPrice"
            placeholder="Daily price"
            value={form.dailyPrice}
            onChange={handleChange}
          />

          <div className="hostQuestionBlock">
            <label className="hostUploadLabel">Is this car available monthly?</label>
            <div className="hostBooleanRow">
              <button
                type="button"
                className={form.isMonthlyAvailable ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isMonthlyAvailable", true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={!form.isMonthlyAvailable ? "hostBoolBtn active" : "hostBoolBtn"}
                onClick={() => setBooleanField("isMonthlyAvailable", false)}
              >
                No
              </button>
            </div>

            {form.isMonthlyAvailable && (
              <input
                name="monthlyPrice"
                placeholder="Monthly price"
                value={form.monthlyPrice}
                onChange={handleChange}
              />
            )}

            <input
              name="hostPhone"
              placeholder="Host phone number"
              value={form.hostPhone}
              onChange={handleChange}
            />
          </div>

          <div className="hostUploadBlock">
            <label className="hostUploadLabel">Car photos</label>

            <div
              className={`hostDropzone ${dragActive ? "dragActive" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <p>Drag and drop photos here</p>
              <p>Minimum 3 photos, maximum 6 photos</p>

              <label className="hostUploadButton">
                Choose photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handleImageInputChange}
                />
              </label>
            </div>

            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="hostPreviewGrid">
                {existingImages.map((image, index) => (
                  <div key={`existing-${index}`} className="hostPreviewCard">
                    <img src={image} alt={`Existing ${index + 1}`} />
                    <button
                      type="button"
                      className="hostRemovePreview"
                      onClick={() => removeExistingImage(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {newImagePreviews.map((image, index) => (
                  <div key={`new-${index}`} className="hostPreviewCard">
                    <img src={image} alt={`New ${index + 1}`} />
                    <button
                      type="button"
                      className="hostRemovePreview"
                      onClick={() => removeNewImage(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hostCalendarBlock">
            <label className="hostUploadLabel">Blocked dates</label>

            <div className="hostCalendarHeader">
              <button type="button" className="hostCalendarNav" onClick={goPrevMonth}>
                ←
              </button>

              <h3 className="hostCalendarTitle">
                {calendarMonth.toLocaleString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </h3>

              <button type="button" className="hostCalendarNav" onClick={goNextMonth}>
                →
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
              {monthDays.map((dateObj, index) => {
                if (!dateObj) {
                  return <div key={`empty-${index}`} className="hostCalendarEmpty" />;
                }

                const formatted = formatLocalDate(dateObj);
                const isSelected = blockedDates.includes(formatted);

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const isPast = new Date(formatted) < today;

                return (
                  <button
                    key={formatted}
                    type="button"
                    className={`hostCalendarDay ${
                      isSelected ? "selected" : ""
                    } ${isPast ? "past" : ""}`}
                    onClick={() => toggleBlockedDate(dateObj)}
                    disabled={isPast}
                  >
                    {dateObj.getDate()}
                  </button>
                );
              })}
            </div>
          </div>

          <textarea
            name="safety"
            placeholder="Safety features separated by comma"
            value={form.safety}
            onChange={handleChange}
          />

          <textarea
            name="tech"
            placeholder="Tech features separated by comma"
            value={form.tech}
            onChange={handleChange}
          />

          <textarea
            name="convenience"
            placeholder="Convenience features separated by comma"
            value={form.convenience}
            onChange={handleChange}
          />

          <textarea
            name="defects"
            placeholder="Defects separated by comma"
            value={form.defects}
            onChange={handleChange}
          />

          {message && <p className="hostSuccess">{message}</p>}
          {error && <p className="hostError">{error}</p>}

          <div className="hostFormActions">
            <button type="submit" disabled={submitting}>
              {submitting
                ? editingCarId
                  ? "Updating..."
                  : "Submitting..."
                : editingCarId
                ? "Update car"
                : "Submit for review"}
            </button>

            {editingCarId && (
              <button
                type="button"
                className="hostCancelBtn"
                onClick={cancelEditing}
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className="hostCarsSection">
          <h2>Your posted cars</h2>

          {loadingCars ? (
            <p className="hostMutedText">Loading your cars...</p>
          ) : myCars.length === 0 ? (
            <p className="hostMutedText">No cars posted yet.</p>
          ) : (
            <div className="hostCarsGrid">
              {myCars.map((car) => (
                <article
                  key={car._id}
                  className="hostCarCard"
                  onClick={() => navigate(`/cars/${car._id}`)}
                >
                  <div className="hostCarImageWrap">
                    <img
                      src={getOptimizedCardImage(car.images?.[0])}
                      alt={car.title}
                      loading="lazy"
                    />
                  </div>

                  <div className="hostCarInfo">
                    <div className="hostStatusBadge">{getStatusText(car)}</div>

                    <h3>{car.title}</h3>
                    <p>
                      {car.year} • {car.type} • {car.transmission}
                    </p>
                    <p>{car.location || car.city || car.airport}</p>
                    <strong>€{car.dailyPrice}/day</strong>
                    {car.isMonthlyAvailable && <p>€{car.monthlyPrice}/month</p>}
                    {car.adminNotes ? (
                      <p className="hostAdminNote">Admin note: {car.adminNotes}</p>
                    ) : null}

                    <div
                      className="hostCarActions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        className="hostEditBtn"
                        onClick={() => startEditingCar(car)}
                      >
                        Update
                      </button>

                      <button
                        type="button"
                        className="hostDeleteBtn"
                        onClick={() => handleDeleteCar(car)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
