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
      "rent a car kosova",
      "rent a car prishtina",
      "rent a car albania",
      "rent a car tirana",
      "rent a car skopje",
      "airport car rental kosovo",
      "airport car rental albania",
      "cheap rent a car kosova",
      "veturo cars",
      "car rental balkans",
    ].join(", ");

    const routeMeta = {
      "/": {
        title: "Veturo Cars | Premium Rent a Car in Kosovo, Albania and the Balkans",
        description:
          "Veturo Cars makes premium car rental simple across Kosovo, Prishtina, Albania, Tirana, Skopje and key Balkan airports with direct city and airport search.",
      },
      "/become-host": {
        title: "Become a Host | Veturo Cars",
        description:
          "Join Veturo Cars as a host and list premium vehicles for travelers searching airport and city car rental across Kosovo, Albania and the Balkans.",
      },
      "/hosts": {
        title: "Host Login | Veturo Cars",
        description:
          "Access the Veturo Cars host area to manage your listings, bookings and availability for premium Balkan car rental guests.",
      },
    };

    const fallbackMeta = {
      title: `${siteName} | Premium Balkan Car Rental`,
      description:
        "Discover premium airport and city car rental with Veturo Cars across Kosovo, Albania, North Macedonia and the wider Balkans.",
    };

    const pageMeta = pathname.startsWith("/cars/")
      ? {
          title: `${siteName} | Car Details`,
          description:
            "View Veturo Cars availability, pricing and booking details for premium rental vehicles in top Balkan cities and airports.",
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
    setMetaByName("twitter:card", "summary_large_image");
    setMetaByName("twitter:title", pageMeta.title);
    setMetaByName("twitter:description", pageMeta.description);
    setCanonical(canonicalUrl);
  }, [language, location.pathname]);

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
