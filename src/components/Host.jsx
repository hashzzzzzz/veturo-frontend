import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./host.css";

import API_URL from "../config/api";

export default function Host({ language = "en" }) {
  const copy = {
    en: {
      wrongPassword: "This password is incorrect.",
      addRecover: "Add your email address for your recover link.",
      recoverSent: (email) => `Recover link sent successfully to ${email}.`,
      recoverFailed: "Could not send recover link right now.",
      chooseImage: "Please choose an image file.",
      chooseOrSkip: "Please choose a profile picture or skip for now.",
      savePicFailed: "Failed to save profile picture.",
      hostPanel: "Host panel",
      loginApproved: "Login as an approved Veturo host",
      hostEmail: "Host email",
      hostPassword: "Host password",
      forgot: "Forgot password?",
      login: "Login",
      choosePhoto: "Choose profile photo",
      photoReuse: "This photo will be reused for your host profile on all your cars.",
      continue: "Continue",
      skip: "Skip for now",
      recoverTitle: "Recover account",
      recoverText: "Add your host email address for your recover link.",
      sending: "Sending...",
      sendRecover: "Send recover link",
    },
    al: {
      wrongPassword: "Ky fjalekalim eshte i pasakte.",
      addRecover: "Shtoni emailin tuaj per linkun e rikuperimit.",
      recoverSent: (email) => `Linku i rikuperimit u dergua me sukses te ${email}.`,
      recoverFailed: "Nuk mund te dergohet linku i rikuperimit tani.",
      chooseImage: "Ju lutem zgjidhni nje file imazhi.",
      chooseOrSkip: "Ju lutem zgjidhni nje fotografi profili ose kalojeni tani.",
      savePicFailed: "Ruajtja e fotografise se profilit deshtoi.",
      hostPanel: "Paneli i hostit",
      loginApproved: "Hyni si host i aprovuar i Veturo",
      hostEmail: "Emaili i hostit",
      hostPassword: "Fjalekalimi i hostit",
      forgot: "Keni harruar fjalekalimin?",
      login: "Hyr",
      choosePhoto: "Zgjidh fotografinë e profilit",
      photoReuse: "Kjo foto do te perdoret ne profilin tuaj te hostit ne te gjitha veturat.",
      continue: "Vazhdo",
      skip: "Kalo tani",
      recoverTitle: "Rikupero llogarine",
      recoverText: "Shtoni emailin e hostit per linkun e rikuperimit.",
      sending: "Duke derguar...",
      sendRecover: "Dergo linkun e rikuperimit",
    },
  }[language] || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [recoverEmail, setRecoverEmail] = useState("");
  const [showRecover, setShowRecover] = useState(false);
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const [showAvatarStep, setShowAvatarStep] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [loggedInToken, setLoggedInToken] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);

  const navigate = useNavigate();

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setError("");

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Host login failed");
      }

      if (!["host", "admin", "superadmin"].includes(data.user?.role)) {
        throw new Error("This account is not approved as host");
      }

      // prefer fresh backend avatar, but if backend still has none,
      // keep previously saved local avatar too
      const savedHostUser = JSON.parse(localStorage.getItem("hostUser") || "null");

      const mergedUser = {
        ...data.user,
        avatar: data.user?.avatar || savedHostUser?.avatar || "",
      };

      setLoggedInUser(mergedUser);
      setLoggedInToken(data.token);

      // if avatar already exists, skip chooser completely
      if (mergedUser.avatar) {
        localStorage.setItem("hostToken", data.token);
        localStorage.setItem("hostUser", JSON.stringify(mergedUser));
        navigate("/hosts/dashboard");
        return;
      }

      setShowAvatarStep(true);
    } catch (err) {
      setError(
        err.message === "Invalid credentials"
          ? copy.wrongPassword
          : err.message
      );
      setRecoverEmail(email.trim());
    }
  };

  const handleRecoverPassword = async () => {
    const safeEmail = (recoverEmail || email).trim();

    if (!safeEmail || !safeEmail.includes("@")) {
      setRecoverMessage(copy.addRecover);
      setShowRecover(true);
      return;
    }

    try {
      setRecoverLoading(true);
      setRecoverMessage("");

      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: safeEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Could not send recover link");
      }

      setRecoverMessage(copy.recoverSent(safeEmail));
    } catch (err) {
      setRecoverMessage(err.message || copy.recoverFailed);
    } finally {
      setRecoverLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(copy.chooseImage);
      return;
    }

    setError("");
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleContinueWithAvatar = async () => {
    try {
      setError("");

      if (!avatarFile) {
        setError(copy.chooseOrSkip);
        return;
      }

      const avatarBase64 = await fileToBase64(avatarFile);

      const updatedUser = {
        ...loggedInUser,
        avatar: avatarBase64,
      };

      localStorage.setItem("hostToken", loggedInToken);
      localStorage.setItem("hostUser", JSON.stringify(updatedUser));

      navigate("/hosts/dashboard");
    } catch {
      setError(copy.savePicFailed);
    }
  };

  const handleSkipAvatar = () => {
    localStorage.setItem("hostToken", loggedInToken);
    localStorage.setItem("hostUser", JSON.stringify(loggedInUser));
    navigate("/hosts/dashboard");
  };

  return (
    <>
      <section className="hostLoginPage">
      <div className="hostLoginCard">
        {!showAvatarStep ? (
          <>
            <h1>{copy.hostPanel}</h1>
            <p>{copy.loginApproved}</p>

            <form onSubmit={handleLogin} className="hostLoginForm">
              <input
                type="email"
                placeholder={copy.hostEmail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <input
                type="password"
                placeholder={copy.hostPassword}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {error && <p className="hostError">{error}</p>}

              <button
                type="button"
                className={`hostPlainLinkBtn ${
                  error === copy.wrongPassword ? "isActive" : ""
                }`}
                onClick={() => {
                  setRecoverEmail(email.trim());
                  setRecoverMessage("");
                  setShowRecover(true);
                }}
              >
                {copy.forgot}
              </button>

              <button type="submit">{copy.login}</button>
            </form>
          </>
        ) : (
          <>
            <h1>{copy.choosePhoto}</h1>
            <p>{copy.photoReuse}</p>

            <div className="hostLoginForm">
              <input type="file" accept="image/*" onChange={handleAvatarChange} />

              {avatarPreview ? (
                <div style={{ marginTop: "14px", textAlign: "center" }}>
                  <img
                    src={avatarPreview}
                    alt="Host avatar preview"
                    style={{
                      width: "90px",
                      height: "90px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "3px solid #111",
                    }}
                  />
                </div>
              ) : null}

              {error && <p className="hostError">{error}</p>}

              <button type="button" onClick={handleContinueWithAvatar}>
                {copy.continue}
              </button>

              <button
                type="button"
                onClick={handleSkipAvatar}
                style={{
                  marginTop: "10px",
                  background: "#f3f3f3",
                  color: "#111",
                }}
              >
                {copy.skip}
              </button>
            </div>
          </>
        )}
      </div>
      </section>

      {showRecover && (
        <div className="hostRecoverOverlay" onClick={() => setShowRecover(false)}>
          <div className="hostRecoverPopup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="hostRecoverClose"
              onClick={() => setShowRecover(false)}
              aria-label="Close recover password popup"
            >
              X
            </button>
            <h3>{copy.recoverTitle}</h3>
            <p>{copy.recoverText}</p>
            <input
              type="email"
              placeholder={copy.hostEmail}
              value={recoverEmail}
              onChange={(e) => {
                setRecoverEmail(e.target.value);
                setRecoverMessage("");
              }}
            />
            {recoverMessage && <p className="hostRecoverMessage">{recoverMessage}</p>}
            <button
              type="button"
              onClick={handleRecoverPassword}
              disabled={recoverLoading}
            >
              {recoverLoading ? copy.sending : copy.sendRecover}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
