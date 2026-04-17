import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import Navbar from "./components/navbar";
import Main from "./components/Main";
import LoginModal from "./components/LoginModal";
import SignupModal from "./components/SignupModal";
import RibbonIcons from "./components/RibbonIcons";
import FeaturedSections from "./components/FeaturedSections";
import CarDetails from "./components/carDetails";
import Footer from "./components/Footer";
import BecomeHost from "./components/BecomeHost";
import Host from "./components/Host";
import HostDashboard from "./components/HostDashboard";
import AdminPanel from "./components/AdminPanel";
import AdminLogin from "./components/AdminLogin";
import ResetPassword from "./components/ResetPassword";
import VerifyEmail from "./components/VerifyEmail";
import { trackPageView } from "./utils/analytics";
import "./appAccess.css";

const LANGUAGE_STORAGE_KEY = "veturoLanguage";

function normalizeLanguage(language = "") {
  if (language === "al" || language === "sq") return "al";
  return "en";
}

const appCopy = {
  en: {
    navbar: {
      savedCars: "Saved cars",
      noSavedCars: "No saved cars yet.",
      internalChat: "Internal chat",
      menu: "Menu",
      becomeHost: "Become a host",
      logout: "Log out",
      login: "Log in",
      signup: "Sign up",
    },
  },
  al: {
    navbar: {
      savedCars: "Vetura te ruajtura",
      noSavedCars: "Ende nuk ke vetura te ruajtura.",
      internalChat: "Biseda e brendshme",
      menu: "Menu",
      becomeHost: "Behu host",
      logout: "Dil",
      login: "Hyr",
      signup: "Regjistrohu",
    },
  },
};

function readStoredJson(key, fallback) {
  const savedValue = localStorage.getItem(key);

  if (!savedValue) return fallback;

  try {
    return JSON.parse(savedValue);
  } catch (error) {
    console.error(`Failed to parse saved ${key}:`, error);
    localStorage.removeItem(key);
    return fallback;
  }
}

function setMetaByName(name, content) {
  let element = document.head.querySelector(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("name", name);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  let element = document.head.querySelector(`meta[property="${property}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute("property", property);
    document.head.appendChild(element);
  }

  element.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let element = document.head.querySelector(`script[data-jsonld="${id}"]`);

  if (!element) {
    element = document.createElement("script");
    element.type = "application/ld+json";
    element.setAttribute("data-jsonld", id);
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  const element = document.head.querySelector(`script[data-jsonld="${id}"]`);

  if (element) {
    element.remove();
  }
}

function AnalyticsRouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`);
  }, [location.pathname, location.search]);

  return null;
}

function SeoMeta({ language }) {
  const location = useLocation();

  useEffect(() => {
    const origin = "https://veturocars.com";
    const pathname = location.pathname || "/";
    const canonicalUrl = new URL(pathname, origin).toString();
    const siteName = "Veturo Cars";
    const keywords = [
      "kerre me qera",
      "kerre me qera kosove",
      "kerre me qera prishtine",
      "kerre me qera tirane",
      "kerre me qera shkup",
      "rent a car kosova",
      "rent a car prishtina",
      "rent a car albania",
      "rent a car tirana",
      "rent a car skopje",
      "rent a car north macedonia",
      "rent a car pristina airport",
      "rent a car tirana airport",
      "rent a car skopje airport",
      "airport car rental kosovo",
      "airport car rental albania",
      "airport car rental north macedonia",
      "PRN airport car rental",
      "TIA airport car rental",
      "SKP airport car rental",
      "cheap rent a car kosova",
      "veturo cars",
      "car rental balkans",
    ].join(", ");

    const routeMeta = {
      "/": {
        title: "Veturo Cars | Rent a Car Kosovo, Albania & North Macedonia",
        description:
          "Search premium rent a car in Pristina, Tirana, Skopje, Kosovo, Albania and North Macedonia, including PRN, TIA and SKP airport car rental.",
      },
      "/become-host": {
        title: "Become a Car Rental Host | Veturo Cars",
        description:
          "List your rental car on Veturo and reach travelers searching car rental in Kosovo, Albania and North Macedonia cities and airports.",
      },
      "/hosts": {
        title: "Host Login | Veturo Cars",
        description:
          "Access the Veturo Cars host area to manage your listings, bookings and availability for premium Balkan car rental guests.",
      },
    };

    const fallbackMeta = {
      title: `${siteName} | Balkan Car Rental`,
      description:
        "Discover premium airport and city car rental with Veturo Cars across Kosovo, Albania, North Macedonia and the wider Balkans.",
    };

    const pageMeta = pathname.startsWith("/cars/")
      ? {
          title: `${siteName} | Car Details`,
          description:
            "View availability, prices, photos and host contact details for a Veturo rental car in Kosovo, Albania or North Macedonia.",
        }
      : routeMeta[pathname] || fallbackMeta;

    document.title = pageMeta.title;
    document.documentElement.lang = language === "al" ? "sq" : "en";

    setMetaByName("description", pageMeta.description);
    setMetaByName("keywords", keywords);
    setMetaByProperty("og:type", pathname === "/" ? "website" : "article");
    setMetaByProperty("og:site_name", siteName);
    setMetaByProperty("og:title", pageMeta.title);
    setMetaByProperty("og:description", pageMeta.description);
    setMetaByProperty("og:url", canonicalUrl);
    setMetaByProperty("og:image", `${origin}/favicon.svg`);
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", pageMeta.title);
    setMetaByName("twitter:description", pageMeta.description);
    setCanonical(canonicalUrl);

    setJsonLd("veturo-organization", {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Veturo Cars",
      url: origin,
      logo: `${origin}/favicon.svg`,
      sameAs: [
        "https://veturocars.com",
      ],
      areaServed: [
        "Kosovo",
        "Albania",
        "North Macedonia",
      ],
    });

    setJsonLd("veturo-website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Veturo Cars",
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: `${origin}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    if (pathname === "/") {
      setJsonLd("veturo-service", {
        "@context": "https://schema.org",
        "@type": "Service",
        name: "Veturo rent a car",
        serviceType: "Car rental",
        provider: {
          "@type": "Organization",
          name: "Veturo Cars",
          url: origin,
        },
        areaServed: [
          "Pristina",
          "Prizren",
          "Peja",
          "Gjakova",
          "Tirana",
          "Durres",
          "Vlora",
          "Skopje",
          "Tetovo",
          "Ohrid",
        ],
      });
    } else {
      removeJsonLd("veturo-service");
    }

    if (!pathname.startsWith("/cars/")) {
      removeJsonLd("veturo-car");
      removeJsonLd("veturo-car-breadcrumb");
    }
  }, [language, location.pathname, location.search]);

  return null;
}

function RequireHost({ children }) {
  const token = localStorage.getItem("hostToken");
  const hostUser = JSON.parse(localStorage.getItem("hostUser") || "null");

  if (!token || !hostUser) {
    return <Navigate to="/hosts" replace />;
  }

  if (!["host", "admin", "superadmin"].includes(hostUser.role)) {
    return <Navigate to="/hosts" replace />;
  }

  return children;
}

function RequireAdmin({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token || !user) {
    return <Navigate to="/admin-login" replace />;
  }

  if (!["admin", "superadmin"].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  const [openLogin, setOpenLogin] = useState(false);
  const [openSignup, setOpenSignup] = useState(false);
  const [user, setUser] = useState(() => readStoredJson("user", null));
  const [favorites, setFavorites] = useState(() =>
    readStoredJson("favorites", [])
  );
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) || "";
  });

  const [searchData, setSearchData] = useState(null);
  const selectedLanguage = normalizeLanguage(language || "en");
  const copy = appCopy[selectedLanguage] || appCopy.en;

  useEffect(() => {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (!language) return;
    document.documentElement.lang = language === "al" ? "sq" : "en";
  }, [language]);

  useEffect(() => {
    const shouldShowWelcome = sessionStorage.getItem("showWelcomePopup");

    if (user && shouldShowWelcome === "true") {
      const showTimer = setTimeout(() => {
        setShowWelcomePopup(true);
      }, 0);

      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
        sessionStorage.removeItem("showWelcomePopup");
      }, 2500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(timer);
      };
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("hostToken");
    localStorage.removeItem("hostUser");
    localStorage.removeItem("favorites");
    sessionStorage.removeItem("showWelcomePopup");

    setUser(null);
    setFavorites([]);
    setShowWelcomePopup(false);
    setSearchData(null);

    window.location.href = "/";
  };

  const toggleFavorite = (car) => {
    setFavorites((prev) => {
      const carKey = car._id || car.id;
      const exists = prev.some((item) => (item._id || item.id) === carKey);

      if (exists) {
        return prev.filter((item) => (item._id || item.id) !== carKey);
      }

      return [...prev, car];
    });
  };

  const isFavorite = (carId) => {
    return favorites.some((item) => (item._id || item.id) === carId);
  };

  const handleLanguageSelect = (nextLanguage) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    setLanguage(nextLanguage);
  };

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin =
    currentUser && ["admin", "superadmin"].includes(currentUser.role);

  return (
    <BrowserRouter>
      <AnalyticsRouteTracker />
      <SeoMeta language={selectedLanguage} />

      <Navbar
        user={user}
        favorites={favorites}
        favoritesCount={favorites.length}
        language={selectedLanguage}
        onLanguageChange={handleLanguageSelect}
        labels={copy.navbar}
        onLogout={handleLogout}
        onLoginClick={() => {
          setOpenSignup(false);
          setOpenLogin(true);
        }}
        onSignupClick={() => {
          setOpenLogin(false);
          setOpenSignup(true);
        }}
      />

      <div className="appQuickAccess">
        {!isAdmin ? (
          <Link to="/admin-login" className="appQuickAccess__btn">
            Admin Access
          </Link>
        ) : (
          <Link to="/admin-panel" className="appQuickAccess__btn">
            Admin Panel
          </Link>
        )}

        <Link to="/hosts" className="appQuickAccess__btn secondary">
          Host Panel
        </Link>
      </div>

      {showWelcomePopup && user && (
        <div className="welcomePopup">
          <div className="welcomePopup__content">
            <div className="welcomePopup__title">
              Hi {user.name?.split(" ")[0] || "there"} 👋
            </div>
            <div className="welcomePopup__text">
              Welcome to Veturo — choose your rental Balkan dream car.
            </div>
          </div>
        </div>
      )}

      <Routes>
        <Route
          path="/"
          element={
            <>
              <Main
                language={selectedLanguage}
                onSearchSubmit={setSearchData}
                initialSearch={searchData}
              />
              <RibbonIcons
                language={selectedLanguage}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
              />
              <FeaturedSections
                language={selectedLanguage}
                activeFilter={activeFilter}
                favorites={favorites}
                toggleFavorite={toggleFavorite}
                isFavorite={isFavorite}
                searchData={searchData}
              />
              <Footer language={selectedLanguage} />
            </>
          }
        />

        <Route
          path="/cars/:id"
          element={
            <CarDetails
              language={selectedLanguage}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          }
        />

        <Route path="/become-host" element={<BecomeHost language={selectedLanguage} />} />
        <Route path="/verify-email" element={<VerifyEmail language={selectedLanguage} />} />
        <Route path="/verify-email/:token" element={<VerifyEmail language={selectedLanguage} />} />
        <Route path="/reset-password/:token" element={<ResetPassword language={selectedLanguage} />} />
        <Route path="/hosts" element={<Host language={selectedLanguage} />} />
        <Route
          path="/hosts/dashboard"
          element={
            <RequireHost>
              <HostDashboard />
            </RequireHost>
          }
        />
        <Route path="/admin-login" element={<AdminLogin setUser={setUser} language={selectedLanguage} />} />
        <Route
          path="/admin-panel"
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />
      </Routes>

      <LoginModal
        language={selectedLanguage}
        isOpen={openLogin}
        onClose={() => setOpenLogin(false)}
        onSignupClick={() => {
          setOpenLogin(false);
          setOpenSignup(true);
        }}
      />
      <SignupModal
        language={selectedLanguage}
        isOpen={openSignup}
        onClose={() => setOpenSignup(false)}
        onLoginClick={() => {
          setOpenSignup(false);
          setOpenLogin(true);
        }}
      />
    </BrowserRouter>
  );
}

export default App;
