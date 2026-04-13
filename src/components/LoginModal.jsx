import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./loginModal.css";

import API_URL from "../config/api";

export default function LoginModal({ isOpen, onClose, onSignupClick, language = "en" }) {
  const copy = {
    en: {
      enterEmail: "Please enter your email.",
      validEmail: "Please enter a valid email.",
      enterPassword: "Please enter your password.",
      minPassword: "Password must be at least 6 characters.",
      wrongPassword: "This password is incorrect.",
      loginFailed: "Login failed. Please try again.",
      googleFailed: "Google login failed. Try email login.",
      addRecover: "Add your email address for your recover link.",
      recoverSent: (email) => `Recover link sent successfully to ${email}.`,
      recoverFailed: "Could not send recover link right now.",
      title: "Log in",
      email: "Email",
      emailPlaceholder: "you@example.com",
      password: "Password",
      passwordPlaceholder: "Your password",
      forgot: "Forgot password?",
      continue: "Continue",
      loggingIn: "Logging in...",
      or: "Or",
      noAccount: "Don't have an account?",
      signup: "Sign up",
      terms: "By logging in, you agree to Veturo's",
      termsLink: "terms of service",
      privacyLink: "privacy policy",
      recoverTitle: "Recover account",
      recoverText: "Add your email address for your recover link.",
      recoverPlaceholder: "Email for recover link",
      sending: "Sending...",
      sendRecover: "Send recover link",
    },
    al: {
      enterEmail: "Ju lutem shkruani emailin tuaj.",
      validEmail: "Ju lutem shkruani nje email te sakte.",
      enterPassword: "Ju lutem shkruani fjalekalimin tuaj.",
      minPassword: "Fjalekalimi duhet te kete te pakten 6 karaktere.",
      wrongPassword: "Ky fjalekalim eshte i pasakte.",
      loginFailed: "Hyrja deshtoi. Ju lutem provoni perseri.",
      googleFailed: "Hyrja me Google deshtoi. Provoni me email.",
      addRecover: "Shtoni emailin tuaj per linkun e rikuperimit.",
      recoverSent: (email) => `Linku i rikuperimit u dergua me sukses te ${email}.`,
      recoverFailed: "Nuk mund te dergohet linku i rikuperimit tani.",
      title: "Hyr",
      email: "Email",
      emailPlaceholder: "ju@shembull.com",
      password: "Fjalekalimi",
      passwordPlaceholder: "Fjalekalimi juaj",
      forgot: "Keni harruar fjalekalimin?",
      continue: "Vazhdo",
      loggingIn: "Duke u kycur...",
      or: "Ose",
      noAccount: "Nuk keni llogari?",
      signup: "Regjistrohu",
      terms: "Duke u kycur, ju pranoni",
      termsLink: "kushtet e sherbimit",
      privacyLink: "politiken e privatesise",
      recoverTitle: "Rikupero llogarine",
      recoverText: "Shtoni emailin tuaj per linkun e rikuperimit.",
      recoverPlaceholder: "Emaili per linkun e rikuperimit",
      sending: "Duke derguar...",
      sendRecover: "Dergo linkun e rikuperimit",
    },
  }[language] || {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverMessage, setRecoverMessage] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  if (!isOpen) return null;

  const saveSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    sessionStorage.setItem("showWelcomePopup", "true");
    onClose();
    window.location.reload();
  };

  const validateForm = () => {
    if (!email.trim()) {
      setFormError(copy.enterEmail);
      return false;
    }

    if (!email.includes("@")) {
      setFormError(copy.validEmail);
      return false;
    }

    if (!password.trim()) {
      setFormError(copy.enterPassword);
      return false;
    }

    if (password.length < 6) {
      setFormError(copy.minPassword);
      return false;
    }

    setFormError("");
    return true;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim(),
        password,
      });

      saveSession(res.data);
    } catch (error) {
      const backendMessage = error.response?.data?.message || "";
      setFormError(
        backendMessage === "Invalid credentials"
          ? copy.wrongPassword
          : backendMessage || copy.loginFailed
      );
      setRecoverEmail(email.trim());
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const res = await axios.post(`${API_URL}/auth/google`, {
        credential: credentialResponse.credential,
      });

      saveSession(res.data);
    } catch (error) {
      setFormError(
        error.response?.data?.message || copy.googleFailed
      );
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

      await axios.post(`${API_URL}/auth/forgot-password`, {
        email: safeEmail,
      });

      setRecoverMessage(copy.recoverSent(safeEmail));
      setShowRecover(true);
    } catch (error) {
      setRecoverMessage(
        error.response?.data?.message || copy.recoverFailed
      );
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="loginModalOverlay" onClick={onClose}>
      <div
        className="loginModal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-modal-title"
      >
        <button
          className="loginModalClose"
          onClick={onClose}
          aria-label="Close login modal"
          type="button"
        >
          X
        </button>

        <h2 id="login-modal-title" className="loginModalTitle">
          {copy.title}
        </h2>

        <div className="loginFieldGroup">
          <label className="loginLabel" htmlFor="login-email">
            {copy.email}
          </label>
          <input
            id="login-email"
            type="email"
            className="loginInput"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFormError("");
            }}
          />
        </div>

        <div className="loginFieldGroup">
          <label className="loginLabel" htmlFor="login-password">
            {copy.password}
          </label>
          <input
            id="login-password"
            type="password"
            className="loginInput"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFormError("");
            }}
          />
        </div>

        {formError && <p className="authMessage">{formError}</p>}

        <button
          className={`forgotPasswordBtn ${
            formError === copy.wrongPassword ? "isActive" : ""
          }`}
          type="button"
          onClick={() => {
            setRecoverEmail(email.trim());
            setRecoverMessage("");
            setShowRecover(true);
          }}
        >
          {copy.forgot}
        </button>

        <button
          className="loginContinueBtn"
          type="button"
          onClick={handleContinue}
          disabled={loading}
        >
          {loading ? copy.loggingIn : copy.continue}
        </button>

        <div className="loginDivider">
          <span>{copy.or}</span>
        </div>

        <div className="googleLoginWrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setFormError("Google login failed.")}
            theme="outline"
            size="large"
            text="continue_with"
            shape="pill"
            width={320}
          />
        </div>

        <p className="signupText">
          {copy.noAccount}{" "}
          <button type="button" onClick={onSignupClick}>
            {copy.signup}
          </button>
        </p>

        <p className="termsText">
          {copy.terms} <a href="/">{copy.termsLink}</a>{" "}
          and <a href="/">{copy.privacyLink}</a>.
        </p>
      </div>

      {showRecover && (
        <div className="recoverPopupOverlay" onClick={() => setShowRecover(false)}>
          <div className="recoverPopup" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="recoverPopupClose"
              onClick={() => setShowRecover(false)}
              aria-label="Close recover password popup"
            >
              X
            </button>
            <h3>{copy.recoverTitle}</h3>
            <p>{copy.recoverText}</p>
            <input
              type="email"
              className="loginInput"
              placeholder={copy.recoverPlaceholder}
              value={recoverEmail}
              onChange={(e) => {
                setRecoverEmail(e.target.value);
                setRecoverMessage("");
              }}
            />
            {recoverMessage && <p className="recoverMessage">{recoverMessage}</p>}
            <button
              type="button"
              className="recoverBtn"
              onClick={handleRecoverPassword}
              disabled={recoverLoading}
            >
              {recoverLoading ? copy.sending : copy.sendRecover}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
