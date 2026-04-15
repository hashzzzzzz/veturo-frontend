import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import { format } from "date-fns";
import {
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  BuildingOffice2Icon,
} from "@heroicons/react/24/outline";
import { XMarkIcon } from "@heroicons/react/24/solid";
import "react-datepicker/dist/react-datepicker.css";
import "./main.css";
import heroBg from "../assets/cargpt2.png";

import API_URL from "../config/api";

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

const SearchDateInput = forwardRef(function SearchDateInput(
  { value, onClick, placeholder, className },
  ref
) {
  const displayValue = value || placeholder;

  return (
    <button
      ref={ref}
      type="button"
      className={className}
      onClick={onClick}
    >
      {displayValue}
    </button>
  );
});

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
  const [activePanel, setActivePanel] = useState(null);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });
  const [dropdownViewportStyle, setDropdownViewportStyle] = useState({});

  const whereRef = useRef(null);
  const searchWrapRef = useRef(null);
  const searchContainerRef = useRef(null);
  const whereInputRef = useRef(null);
  const whereDropdownRef = useRef(null);

  const isSearchOverlayActive = isMobileViewport && activePanel === "where";
  const isWhereActive = activePanel === "where";
  const isFromActive = activePanel === "from";
  const isUntilActive = activePanel === "until";

  function scrollSearchIntoView(behavior = "smooth", block = "nearest") {
    if (!isMobileViewport) return;

    window.setTimeout(() => {
      searchWrapRef.current?.scrollIntoView({
        behavior,
        block,
      });
    }, 120);
  }

  function moveWhereSearchToTop() {
    if (!isMobileViewport) return;

    window.scrollTo(0, 0);
    scrollSearchIntoView("auto", "start");
  }

  function resetWhereDropdownScroll() {
    if (!whereDropdownRef.current) return;

    whereDropdownRef.current.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }

  function updateMobileWhereDropdownPosition() {
    if (!isMobileViewport || !isWhereActive || !whereInputRef.current) {
      setDropdownViewportStyle({});
      return;
    }

    const rect = whereInputRef.current.getBoundingClientRect();
    const viewportTop = window.visualViewport?.offsetTop || 0;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const viewportBottom = viewportTop + viewportHeight;
    const top = Math.max(rect.bottom + 6, viewportTop + 8);
    const maxHeight = Math.max(160, viewportBottom - top - 8);

    setDropdownViewportStyle({
      "--where-dropdown-top": `${Math.round(top)}px`,
      "--where-dropdown-max-height": `${Math.round(maxHeight)}px`,
    });
  }

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setWhereOpen(false);
        setActivePanel(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const updateViewport = (event) => {
      setIsMobileViewport(event.matches);
    };

    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", updateViewport);
      return () => mediaQuery.removeEventListener("change", updateViewport);
    }

    mediaQuery.addListener(updateViewport);
    return () => mediaQuery.removeListener(updateViewport);
  }, []);

  useEffect(() => {
    if (!whereOpen && activePanel === "where") {
      setActivePanel(null);
    }
  }, [whereOpen, activePanel]);

  useEffect(() => {
    if (!isSearchOverlayActive) return;

    moveWhereSearchToTop();

    if (!window.visualViewport) return;

    const keepSearchVisible = () => {
      moveWhereSearchToTop();
      updateMobileWhereDropdownPosition();
    };

    window.visualViewport.addEventListener("resize", keepSearchVisible);
    window.visualViewport.addEventListener("scroll", keepSearchVisible);

    return () => {
      window.visualViewport.removeEventListener("resize", keepSearchVisible);
      window.visualViewport.removeEventListener("scroll", keepSearchVisible);
    };
  }, [isSearchOverlayActive]);

  useEffect(() => {
    updateMobileWhereDropdownPosition();
  }, [isMobileViewport, isWhereActive, where]);

  useEffect(() => {
    if (!isWhereActive) return;

    resetWhereDropdownScroll();
  }, [isWhereActive, where]);

  useEffect(() => {
    const shouldHideChrome = isMobileViewport && isSearchOverlayActive;

    document.body.classList.toggle("mobileSearchActive", shouldHideChrome);

    return () => {
      document.body.classList.remove("mobileSearchActive");
    };
  }, [isMobileViewport, isSearchOverlayActive]);

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
    setActivePanel(null);
    setSelectedOption(item);
    setSearchError("");
    submitWithItem(item);
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
    setActivePanel(null);
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

    if (isMobileViewport) {
      setActivePanel(null);
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

    if (isMobileViewport) {
      setActivePanel(null);
    }
  }

  function handleWhereChange(value) {
    setWhere(value);
    setWhereOpen(true);
    setActivePanel("where");
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
    setActivePanel(null);
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

  function closeFromPanel() {
    clearFromDate();
    setActivePanel(null);
  }

  function clearUntilDate() {
    setUntilDate(null);
    setSearchError("");

    if (!selectedOption) {
      return;
    }

    submitWithItem(selectedOption, fromDate, null);
  }

  function closeUntilPanel() {
    clearUntilDate();
    setActivePanel(null);
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

        <div className={`hero__content ${isSearchOverlayActive ? "hero__content--searchActive" : ""}`}>
          <div className="hero__text">
            <p className="hero__eyebrow">{copy.eyebrow}</p>
          </div>

          <div
            ref={searchWrapRef}
            className={`hero__searchWrap ${isSearchOverlayActive ? "hero__searchWrap--active" : ""}`}
          >
            <div
              ref={searchContainerRef}
              className={`hero__searchShell ${
                isMobileViewport && (isFromActive || isUntilActive)
                  ? "hero__searchShell--calendarOpen"
                  : ""
              }`}
            >
            <div className="hero__search">
              <div className="search__item search__item--where">
                <label>{copy.where}</label>

                <div className="whereDropdownWrap" ref={whereRef}>
                  <div style={{ position: "relative" }}>
                    <input
                      ref={whereInputRef}
                      type="text"
                      placeholder={copy.wherePlaceholder}
                      value={where}
                      onFocus={() => {
                        setWhereOpen(true);
                        setActivePanel("where");
                        moveWhereSearchToTop();
                        updateMobileWhereDropdownPosition();
                      }}
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

                  {whereOpen && isWhereActive && (
                    <div
                      ref={whereDropdownRef}
                      className="whereDropdown"
                      style={dropdownViewportStyle}
                    >
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
                    onFocus={() => {
                      if (isMobileViewport) {
                        setWhereOpen(false);
                        setActivePanel("from");
                      }
                    }}
                    onCalendarOpen={() => {
                      if (!isMobileViewport) {
                        setActivePanel("from");
                      }
                    }}
                    onCalendarClose={() => {
                      if (!isMobileViewport) {
                        setActivePanel(null);
                      }
                    }}
                    onInputClick={() => {
                      if (isMobileViewport) {
                        setWhereOpen(false);
                        setActivePanel("from");
                      }
                    }}
                    placeholderText={copy.addDates}
                    dateFormat="dd MMM yyyy"
                    className="search__dateInput"
                    popperPlacement="bottom-start"
                    minDate={today}
                    withPortal={false}
                    inline={isMobileViewport && isFromActive}
                    shouldCloseOnSelect={!isMobileViewport}
                    customInput={
                      isMobileViewport ? (
                        <SearchDateInput
                          className="search__dateInput search__dateInputButton"
                          placeholder={copy.addDates}
                        />
                      ) : undefined
                    }
                    value={
                      fromDate ? format(fromDate, "dd MMM yyyy") : undefined
                    }
                  />
                  {(fromDate || (isMobileViewport && isFromActive)) && (
                    <button
                      type="button"
                      onClick={isMobileViewport && isFromActive ? closeFromPanel : clearFromDate}
                      aria-label={isMobileViewport && isFromActive ? "Close from calendar" : "Clear from date"}
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
                    onFocus={() => {
                      if (isMobileViewport) {
                        setWhereOpen(false);
                        setActivePanel("until");
                      }
                    }}
                    onCalendarOpen={() => {
                      if (!isMobileViewport) {
                        setActivePanel("until");
                      }
                    }}
                    onCalendarClose={() => {
                      if (!isMobileViewport) {
                        setActivePanel(null);
                      }
                    }}
                    onInputClick={() => {
                      if (isMobileViewport) {
                        setWhereOpen(false);
                        setActivePanel("until");
                      }
                    }}
                    placeholderText={copy.addDates}
                    dateFormat="dd MMM yyyy"
                    minDate={fromDate || today}
                    className="search__dateInput"
                    popperPlacement="bottom-start"
                    withPortal={false}
                    inline={isMobileViewport && isUntilActive}
                    shouldCloseOnSelect={!isMobileViewport}
                    customInput={
                      isMobileViewport ? (
                        <SearchDateInput
                          className="search__dateInput search__dateInputButton"
                          placeholder={copy.addDates}
                        />
                      ) : undefined
                    }
                    value={
                      untilDate ? format(untilDate, "dd MMM yyyy") : undefined
                    }
                  />
                  {(untilDate || (isMobileViewport && isUntilActive)) && (
                    <button
                      type="button"
                      onClick={isMobileViewport && isUntilActive ? closeUntilPanel : clearUntilDate}
                      aria-label={isMobileViewport && isUntilActive ? "Close until calendar" : "Clear until date"}
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
