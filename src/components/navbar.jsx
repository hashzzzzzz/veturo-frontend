import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserCircleIcon, HeartIcon, XMarkIcon } from "@heroicons/react/24/outline";
import "./navbar.css";
import logo from "../assets/mepike.jpg";

function Navbar({
  user,
  favorites = [],
  favoritesCount,
  language = "en",
  onLanguageChange,
  labels = {},
  onLogout,
  onLoginClick,
  onSignupClick,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const navigate = useNavigate();

  const handleBecomeHost = () => {
    setMenuOpen(false);
    navigate("/become-host");
  };

  const handleLanguageChange = (nextLanguage) => {
    onLanguageChange?.(nextLanguage);
  };

  return (
    <nav className="navbar" aria-label="Main navigation">
      <div className="navbar__left">
        <img
          src={logo}
          alt="Veturo logo"
          className="navbar__logo"
         onClick={() => {
  if (window.location.pathname.startsWith("/cars/")) {
    window.location.href = "/";
  } else {
    navigate("/");
  }
}}
          style={{ cursor: "pointer" }}
        />
      </div>

      <div className="navbar__right">
        <div
          className="navbar__favoritesWrap"
        >
          <button
            type="button"
            className="navbar__favorites"
            title="Saved favorites"
            onClick={() => {
              setFavoritesOpen(true);
              setMenuOpen(false);
            }}
          >
            <HeartIcon className="navbar__favoritesIcon" />
            <span className="navbar__favoritesCount">{favoritesCount}</span>
          </button>

          {favoritesOpen && (
            <div className="navbar__favoritesDropdown">
              <div className="navbar__favoritesHeader">
                <span>{labels.savedCars || "Saved cars"}</span>
                <button
                  type="button"
                  className="navbar__favoritesClose"
                  onClick={() => setFavoritesOpen(false)}
                >
                  <XMarkIcon className="navbar__favoritesCloseIcon" />
                </button>
              </div>

              {favorites.length === 0 ? (
                <div className="navbar__favoritesEmpty">
                  {labels.noSavedCars || "No saved cars yet."}
                </div>
              ) : (
                <div className="navbar__favoritesList">
                  {favorites.map((car) => (
                    <div key={car.id} className="navbar__favoriteCard">
                      <img
                        src={car.image}
                        alt={car.title}
                        className="navbar__favoriteImage"
                        onClick={() => navigate(`/cars/${car.id}`)}
                      />

                      <div className="navbar__favoriteInfo">
                        <div className="navbar__favoriteTitle">{car.title}</div>
                        <div className="navbar__favoriteMeta">
                          {car.location}
                        </div>

                        <button
                          type="button"
                          className="navbar__favoriteChatBtn"
                        >
                          {labels.internalChat || "Internal chat"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="navbar__menuWrap">
          <button
            type="button"
            className="navbar__menu"
            onClick={() => {
              setMenuOpen((prev) => !prev);
              setFavoritesOpen(false);
            }}
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className="hamburger" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>

            {user?.avatar ? (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="navbar__avatar"
              />
            ) : (
              <UserCircleIcon className="navbar__userIcon" />
            )}
          </button>

          {menuOpen && (
            <div className="navbar__dropdown">
              <div className="navbar__dropdownHeader">
                <span>{labels.menu || "Menu"}</span>

                <button
                  type="button"
                  className="navbar__favoritesClose"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <XMarkIcon className="navbar__favoritesCloseIcon" />
                </button>
              </div>

              <div className="navbar__dropdownLang">
                <button
                  type="button"
                  className={language === "en" ? "lang active" : "lang"}
                  onClick={() => handleLanguageChange("en")}
                >
                  EN
                </button>
                <button
                  type="button"
                  className={language === "al" ? "lang active" : "lang"}
                  onClick={() => handleLanguageChange("al")}
                >
                  AL
                </button>
              </div>

              {user ? (
                <>
                  <div className="dropdown__item dropdown__item--primary">
                    {user.name}
                  </div>

                  <div className="dropdown__item">{user.email}</div>

                  <button
                    type="button"
                    className="dropdown__item"
                    onClick={handleBecomeHost}
                  >
                    {labels.becomeHost || "Become a host"}
                  </button>

                  <button
                    type="button"
                    className="dropdown__item"
                    onClick={() => {
                      setMenuOpen(false);
                      onLogout();
                    }}
                  >
                    {labels.logout || "Log out"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="dropdown__item dropdown__item--primary"
                    onClick={() => {
                      setMenuOpen(false);
                      onLoginClick();
                    }}
                  >
                    {labels.login || "Log in"}
                  </button>

                  <button
                    type="button"
                    className="dropdown__item"
                    onClick={() => {
                      setMenuOpen(false);
                      onSignupClick();
                    }}
                  >
                    {labels.signup || "Sign up"}
                  </button>

                  <button
                    type="button"
                    className="dropdown__item"
                    onClick={handleBecomeHost}
                  >
                    {labels.becomeHost || "Become a host"}
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="navbar__lang">
          <button
            type="button"
            className={language === "en" ? "lang active" : "lang"}
            onClick={() => handleLanguageChange("en")}
          >
            EN
          </button>
          <button
            type="button"
            className={language === "al" ? "lang active" : "lang"}
            onClick={() => handleLanguageChange("al")}
          >
            AL
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
