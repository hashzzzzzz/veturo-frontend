import { useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import {
  PaperAirplaneIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import "react-datepicker/dist/react-datepicker.css";
import "./Main.css";
import heroBg from "../assets/cargpt2.png";

const API_URL = "http://localhost:5000/api";

function slugify(value = "") {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildManualCityItem(value = "") {
  const clean = value.trim();

  return {
    id: clean.toLowerCase(),
    type: "city",
    title: clean,
    subtitle: "City",
    value: clean,
    targetSectionKey: `city-${slugify(clean)}`,
  };
}

export default function Main({
  language = "en",
  onSearchSubmit,
  initialSearch = null,
}) {
  const copy = {
    en: {
      eyebrow: "DRIVE YOUR WAY",
      where: "Where",
      wherePlaceholder: "City, airport, address or hotel",
      chooseLocation: "Choose location",
      nearby: "Nearby",
      shareLocation: "Share my location",
      airports: "Airports",
      cities: "Cities",
      loading: "Loading...",
      checkingAirports: "Checking available airports",
      availableAirports: (count) => `Available on ${count} airports`,
      availableCities: (count) => `Available in ${count} cities`,
      typeToSeeAirports: "Start typing to see airport results",
      typeToSeeCities: "Start typing to see city results",
      searchingAirports: "Searching airport results",
      noAirportResults: "No airport results",
      tryAirport: "Try another airport name or code",
      city: "City",
      from: "From",
      until: "Until",
      addDates: "Add dates",
      search: "Search",
      selectFirst: "Please select a city or airport first.",
    },
    al: {
      eyebrow: "NGASJE SIPAS STILIT TEND",
      where: "Ku",
      wherePlaceholder: "Qytet, aeroport, adrese ose hotel",
      chooseLocation: "Zgjidh lokacionin",
      nearby: "Afer meje",
      shareLocation: "Ndaj lokacionin tim",
      airports: "Aeroportet",
      cities: "Qytetet",
      loading: "Duke u ngarkuar...",
      checkingAirports: "Po kontrollohen aeroportet e lira",
      availableAirports: (count) => `Ne dispozicion ne ${count} aeroporte`,
      availableCities: (count) => `Ne dispozicion ne ${count} qytete`,
      typeToSeeAirports: "Fillo te shkruash per te pare aeroportet",
      typeToSeeCities: "Fillo te shkruash per te pare qytetet",
      searchingAirports: "Po kerkohen aeroportet",
      noAirportResults: "Nuk u gjet asnje aeroport",
      tryAirport: "Provo nje emer ose kod tjeter aeroporti",
      city: "Qytet",
      from: "Nga",
      until: "Deri",
      addDates: "Shto datat",
      search: "Kerko",
      selectFirst: "Ju lutem zgjidhni fillimisht nje qytet ose aeroport.",
    },
  }[language] || {
    eyebrow: "DRIVE YOUR WAY",
  };
  const [fromDate, setFromDate] = useState(initialSearch?.fromDate || null);
  const [untilDate, setUntilDate] = useState(initialSearch?.untilDate || null);
  const [where, setWhere] = useState(initialSearch?.where || "");
  const [whereOpen, setWhereOpen] = useState(false);
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOption, setSelectedOption] = useState(
    initialSearch
      ? {
          id: initialSearch.airport || initialSearch.city || initialSearch.where || "",
          type: initialSearch.type || (initialSearch.airport ? "airport" : "city"),
          title: initialSearch.where || initialSearch.city || initialSearch.airport || "",
          value: initialSearch.city || initialSearch.where || "",
          airportCode: initialSearch.airport || "",
          targetSectionKey: initialSearch.targetSectionKey || "",
        }
      : null
  );
  const [searchError, setSearchError] = useState("");

  const whereRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (whereRef.current && !whereRef.current.contains(event.target)) {
        setWhereOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);

        const query = where.trim()
          ? `?q=${encodeURIComponent(where.trim())}`
          : "";

        const res = await fetch(`${API_URL}/cars/search/options${query}`, {
          signal: controller.signal,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to fetch search options");
        }

        setOptions(Array.isArray(data) ? data : []);
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error(err);
        }
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchOptions();

    return () => controller.abort();
  }, [where]);

  const airportOptions = useMemo(
    () => options.filter((item) => item.type === "airport"),
    [options]
  );

  const cityOptions = useMemo(
    () => options.filter((item) => item.type === "city"),
    [options]
  );

  const airportCount = useMemo(() => {
    const uniqueAirports = new Set(
      airportOptions
        .map((item) =>
          (item.airportCode || item.value || item.title || "").trim().toLowerCase()
        )
        .filter(Boolean)
    );

    return uniqueAirports.size;
  }, [airportOptions]);

  const cityCount = useMemo(() => {
    const uniqueCities = new Set(
      cityOptions
        .map((item) => (item.value || item.title || "").trim().toLowerCase())
        .filter(Boolean)
    );

    return uniqueCities.size;
  }, [cityOptions]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const hasTypedSearch = where.trim().length > 0;

  function createPayload(item, nextFromDate = fromDate, nextUntilDate = untilDate) {
    return {
      where: item.title,
      type: item.type,
      city: item.type === "city" ? item.value || item.title : "",
      airport: item.type === "airport" ? item.airportCode || item.value : "",
      targetSectionKey:
        item.targetSectionKey ||
        (item.type === "city"
          ? `city-${slugify(item.value || item.title)}`
          : item.type === "airport"
          ? `airport-${slugify(item.airportCode || item.value || item.title)}`
          : ""),
      fromDate: nextFromDate,
      untilDate: nextUntilDate,
    };
  }

  function submitWithItem(item, nextFromDate = fromDate, nextUntilDate = untilDate) {
    if (!item) return;

    setSearchError("");
    onSearchSubmit?.(createPayload(item, nextFromDate, nextUntilDate));
  }

  function resetSearch() {
    onSearchSubmit?.(null);
  }

  function handleOptionPick(item) {
    setWhere(item.title);
    setWhereOpen(false);
    setSelectedOption(item);
    setSearchError("");
    submitWithItem(item);
  }

  function handleNearbyClick() {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const label = `Nearby me (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`;

        const nearbyItem = {
          id: label,
          type: "nearby",
          title: label,
          value: "",
          airportCode: "",
          targetSectionKey: "",
        };

        setWhere(label);
        setWhereOpen(false);
        setSelectedOption(nearbyItem);
        setSearchError("");

        onSearchSubmit?.({
          where: label,
          type: "nearby",
          city: "",
          airport: "",
          targetSectionKey: "",
          latitude,
          longitude,
          fromDate,
          untilDate,
        });
      },
      () => {
        alert("Location access was denied or unavailable.");
      }
    );
  }

  function findBestOptionFromWhere() {
    const normalizedWhere = where.trim().toLowerCase();
    if (!normalizedWhere) return null;

    const exactCity = cityOptions.find(
      (item) =>
        item.title?.trim().toLowerCase() === normalizedWhere ||
        item.value?.trim().toLowerCase() === normalizedWhere
    );
    if (exactCity) return exactCity;

    const exactAirport = airportOptions.find(
      (item) =>
        item.title?.trim().toLowerCase() === normalizedWhere ||
        item.airportCode?.trim().toLowerCase() === normalizedWhere ||
        item.value?.trim().toLowerCase() === normalizedWhere
    );
    if (exactAirport) return exactAirport;

    const firstOption = options[0];
    if (firstOption) return firstOption;

    return buildManualCityItem(where);
  }

  function handleSearchClick() {
    const bestItem = findBestOptionFromWhere();

    if (!bestItem) {
      setSearchError(copy.selectFirst);
      return;
    }

    setSelectedOption(bestItem);
    submitWithItem(bestItem);
    setWhereOpen(false);
  }

  function onFromChange(date) {
    let nextUntilDate = untilDate;

    if (date && untilDate && untilDate < date) {
      nextUntilDate = date;
      setUntilDate(date);
    }

    setFromDate(date);

    if (!where.trim()) {
      setSearchError(copy.selectFirst);
      return;
    }

    if (selectedOption) {
      submitWithItem(selectedOption, date, nextUntilDate);
    }
  }

  function onUntilChange(date) {
    setUntilDate(date);

    if (!where.trim()) {
      setSearchError(copy.selectFirst);
      return;
    }

    if (selectedOption) {
      submitWithItem(selectedOption, fromDate, date);
    }
  }

  function handleWhereChange(value) {
    setWhere(value);
    setWhereOpen(true);
    setSearchError("");

    if (!value.trim()) {
      setSelectedOption(null);
      resetSearch();
      return;
    }

    if (
      selectedOption &&
      value.trim().toLowerCase() !== selectedOption.title?.trim().toLowerCase()
    ) {
      setSelectedOption(null);
    }
  }

  function clearWhere() {
    setWhere("");
    setWhereOpen(false);
    setSelectedOption(null);
    setSearchError("");
    resetSearch();
  }

  function clearFromDate() {
    setFromDate(null);
    setSearchError("");

    if (!selectedOption) {
      return;
    }

    submitWithItem(selectedOption, null, untilDate);
  }

  function clearUntilDate() {
    setUntilDate(null);
    setSearchError("");

    if (!selectedOption) {
      return;
    }

    submitWithItem(selectedOption, fromDate, null);
  }

  useEffect(() => {
    if (!selectedOption) return;
    if (!where.trim()) return;

    submitWithItem(selectedOption, fromDate, untilDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, untilDate]);

  const cityValue = where.trim() || "Pristina";

  return (
    <main className="hero">
      <section
        className="hero__card"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.18), rgba(0, 0, 0, 0.24)), url(${heroBg})`,
        }}
      >
        <div className="hero__overlay" />

        <div className="hero__content">
          <div className="hero__text">
            <p className="hero__eyebrow">{copy.eyebrow}</p>
          </div>

          <div className="hero__searchWrap">
            <div className="hero__search">
              <div className="search__item search__item--where">
                <label>{copy.where}</label>

                <div className="whereDropdownWrap" ref={whereRef}>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      placeholder={copy.wherePlaceholder}
                      value={where}
                      onFocus={() => setWhereOpen(true)}
                      onChange={(e) => handleWhereChange(e.target.value)}
                      style={{ paddingRight: where ? "42px" : undefined }}
                    />

                    {where && (
                      <button
                        type="button"
                        onClick={clearWhere}
                        aria-label="Clear where"
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "#000000",
                          borderRadius: "50%",
                          width: "26px",
                          height: "26px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                          zIndex: 2,
                        }}
                      >
                        <XMarkIcon style={{ width: 16, height: 16, color: "#fff" }} />
                      </button>
                    )}
                  </div>

                  {whereOpen && (
                    <div className="whereDropdown">
                      <div className="whereDropdown__topbar">
                            <span>{copy.chooseLocation}</span>
                        <button
                          type="button"
                          className="whereDropdown__close"
                          aria-label="Close location dropdown"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setWhereOpen(false)}
                        >
                          <XMarkIcon />
                        </button>
                      </div>

                      <button
                        type="button"
                        className="whereDropdown__nearby"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={handleNearbyClick}
                      >
                        <span className="whereDropdown__nearbyIcon">
                          <MapPinIcon />
                        </span>
                        <span className="whereDropdown__nearbyText">
                          <span className="whereDropdown__title">{copy.nearby}</span>
                          <span className="whereDropdown__subtitle">
                            {copy.shareLocation}
                          </span>
                        </span>
                      </button>

                      {!hasTypedSearch ? (
                        <>
                          <div className="whereDropdown__header">
                            <span className="whereDropdown__headerIcon">
                              <PaperAirplaneIcon />
                            </span>
                            <span>{copy.airports}</span>
                          </div>

                          {loadingOptions ? (
                            <div className="whereDropdown__item whereDropdown__item--static">
                              <span className="whereDropdown__icon">
                                <PaperAirplaneIcon />
                              </span>

                              <span className="whereDropdown__content">
                                <span className="whereDropdown__title">{copy.loading}</span>
                                <span className="whereDropdown__subtitle">
                                  {copy.checkingAirports}
                                </span>
                              </span>
                            </div>
                          ) : (
                            <div className="whereDropdown__item whereDropdown__item--static">
                              <span className="whereDropdown__icon">
                                <PaperAirplaneIcon />
                              </span>

                              <span className="whereDropdown__content">
                                <span className="whereDropdown__title">
                                  {copy.availableAirports(airportCount)}
                                </span>
                                <span className="whereDropdown__subtitle">
                                  {copy.typeToSeeAirports}
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="whereDropdown__header whereDropdown__header--cities">
                            <span className="whereDropdown__headerIcon">
                              <BuildingOffice2Icon />
                            </span>
                            <span>{copy.cities}</span>
                          </div>

                          <div className="whereDropdown__item whereDropdown__item--city whereDropdown__item--static">
                            <span className="whereDropdown__icon">
                              <MagnifyingGlassIcon />
                            </span>

                            <span className="whereDropdown__content">
                              <span className="whereDropdown__title">
                                {copy.availableCities(cityCount)}
                              </span>
                              <span className="whereDropdown__subtitle">
                                {copy.typeToSeeCities}
                              </span>
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="whereDropdown__header">
                            <span className="whereDropdown__headerIcon">
                              <PaperAirplaneIcon />
                            </span>
                            <span>{copy.airports}</span>
                          </div>

                          {loadingOptions ? (
                            <div className="whereDropdown__item whereDropdown__item--static">
                              <span className="whereDropdown__icon">
                                <PaperAirplaneIcon />
                              </span>

                              <span className="whereDropdown__content">
                                <span className="whereDropdown__title">{copy.loading}</span>
                                <span className="whereDropdown__subtitle">
                                  {copy.searchingAirports}
                                </span>
                              </span>
                            </div>
                          ) : airportOptions.length > 0 ? (
                            airportOptions.map((airport) => (
                              <button
                                key={airport.id}
                                type="button"
                                className="whereDropdown__item"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleOptionPick(airport)}
                              >
                                <span className="whereDropdown__icon">
                                  <PaperAirplaneIcon />
                                </span>

                                <span className="whereDropdown__content">
                                  <span className="whereDropdown__title">
                                    {airport.title}
                                  </span>
                                  <span className="whereDropdown__subtitle">
                                    {airport.subtitle}
                                  </span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="whereDropdown__item whereDropdown__item--static">
                              <span className="whereDropdown__icon">
                                <PaperAirplaneIcon />
                              </span>

                              <span className="whereDropdown__content">
                                <span className="whereDropdown__title">
                                  {copy.noAirportResults}
                                </span>
                                <span className="whereDropdown__subtitle">
                                  {copy.tryAirport}
                                </span>
                              </span>
                            </div>
                          )}

                          <div className="whereDropdown__header whereDropdown__header--cities">
                            <span className="whereDropdown__headerIcon">
                              <BuildingOffice2Icon />
                            </span>
                            <span>{copy.cities}</span>
                          </div>

                          {cityOptions.length > 0 ? (
                            cityOptions.map((city) => (
                              <button
                                key={city.id}
                                type="button"
                                className="whereDropdown__item whereDropdown__item--city"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => handleOptionPick(city)}
                              >
                                <span className="whereDropdown__icon">
                                  <MagnifyingGlassIcon />
                                </span>

                                <span className="whereDropdown__content">
                                  <span className="whereDropdown__title">
                                    {city.title}
                                  </span>
                                  <span className="whereDropdown__subtitle">
                                    {city.subtitle}
                                  </span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <button
                              type="button"
                              className="whereDropdown__item whereDropdown__item--city"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleOptionPick(buildManualCityItem(cityValue))}
                            >
                              <span className="whereDropdown__icon">
                                <MagnifyingGlassIcon />
                              </span>

                              <span className="whereDropdown__content">
                                <span className="whereDropdown__title">{cityValue}</span>
                                <span className="whereDropdown__subtitle">{copy.city}</span>
                              </span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="search__divider" />

              <div className="search__item">
                <label>{copy.from}</label>
                <div style={{ position: "relative" }}>
                  <DatePicker
                    selected={fromDate}
                    onChange={onFromChange}
                    placeholderText={copy.addDates}
                    dateFormat="dd MMM yyyy"
                    className="search__dateInput"
                    popperPlacement="bottom-start"
                    minDate={today}
                  />
                  {fromDate && (
                    <button
                      type="button"
                      onClick={clearFromDate}
                      aria-label="Clear from date"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "#000",
                        borderRadius: "50%",
                        width: "26px",
                        height: "26px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        zIndex: 2,
                      }}
                    >
                      <XMarkIcon style={{ width: 16, height: 16, color: "#fff" }} />
                    </button>
                  )}
                </div>
              </div>

              <div className="search__divider" />

              <div className="search__item">
                <label>{copy.until}</label>
                <div style={{ position: "relative" }}>
                  <DatePicker
                    selected={untilDate}
                    onChange={onUntilChange}
                    placeholderText={copy.addDates}
                    dateFormat="dd MMM yyyy"
                    minDate={fromDate || today}
                    className="search__dateInput"
                    popperPlacement="bottom-start"
                  />
                  {untilDate && (
                    <button
                      type="button"
                      onClick={clearUntilDate}
                      aria-label="Clear until date"
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        border: "none",
                        background: "#000",
                        borderRadius: "50%",
                        width: "26px",
                        height: "26px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        zIndex: 2,
                      }}
                    >
                      <XMarkIcon style={{ width: 16, height: 16, color: "#fff" }} />
                    </button>
                  )}
                </div>
              </div>

              <button
                className="search__button"
                type="button"
                onClick={handleSearchClick}
              >
                {copy.search}
              </button>
            </div>
          </div>

          {searchError ? (
            <p
              style={{
                marginTop: "12px",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: 700,
                textShadow: "0 2px 8px rgba(0,0,0,0.35)",
              }}
            >
              {searchError}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}
