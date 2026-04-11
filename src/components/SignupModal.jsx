import { useState } from "react";
import axios from "axios";
import { GoogleLogin } from "@react-oauth/google";
import "./signupModal.css";

const API_URL = "http://localhost:5000/api";

export default function SignupModal({ isOpen, onClose, onLoginClick, language = "en" }) {
  const copy = {
    en: {
      required: "Name, email and password are required.",
      validEmail: "Please enter a valid email.",
      minPassword: "Password must be at least 6 characters.",
      accountCreated: "Account created. Please verify your email before logging in.",
      signupFailed: "Signup failed. Please try again.",
      googleFailed: "Google signup failed. Try email signup.",
      title: "Welcome to Veturo",
      subtitle: "Create your account, verify email, then start saving cars.",
      fullName: "Full name",
      yourName: "Your name",
      email: "Email",
      password: "Password",
      minChars: "At least 6 characters",
      creating: "Creating account...",
      signupEmail: "Sign up with email",
      or: "Or",
      alreadyHave: "Already have an account?",
      login: "Log in",
      terms: "By signing up, you agree to Veturo's",
      termsLink: "terms of service",
      privacyLink: "privacy policy",
    },
    al: {
      required: "Emri, emaili dhe fjalekalimi jane te detyrueshem.",
      validEmail: "Ju lutem shkruani nje email te sakte.",
      minPassword: "Fjalekalimi duhet te kete te pakten 6 karaktere.",
      accountCreated: "Llogaria u krijua. Ju lutem verifikoni emailin para hyrjes.",
      signupFailed: "Regjistrimi deshtoi. Ju lutem provoni perseri.",
      googleFailed: "Regjistrimi me Google deshtoi. Provoni me email.",
      title: "Mire se vini ne Veturo",
      subtitle: "Krijoni llogarine, verifikoni emailin dhe pastaj filloni te ruani vetura.",
      fullName: "Emri i plote",
      yourName: "Emri juaj",
      email: "Email",
      password: "Fjalekalimi",
      minChars: "Te pakten 6 karaktere",
      creating: "Duke krijuar llogarine...",
      signupEmail: "Regjistrohu me email",
      or: "Ose",
      alreadyHave: "Keni llogari?",
      login: "Hyr",
      terms: "Duke u regjistruar, ju pranoni",
      termsLink: "kushtet e sherbimit",
      privacyLink: "politiken e privatesise",
    },
  }[language] || {};
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("info");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const saveSession = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    sessionStorage.setItem("showWelcomePopup", "true");
    onClose();
    window.location.reload();
  };

  const setNotice = (text, tone = "info") => {
    setMessage(text);
    setMessageTone(tone);
  };

  const handleEmailSignup = async (event) => {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setNotice(copy.required, "error");
      return;
    }

    if (!email.includes("@")) {
      setNotice(copy.validEmail, "error");
      return;
    }

    if (password.length < 6) {
      setNotice(copy.minPassword, "error");
      return;
    }

    setLoading(true);
    setNotice("");

    try {
      const res = await axios.post(`${API_URL}/auth/signup`, {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      const devLink = res.data.verificationUrl
        ? ` Dev link: ${res.data.verificationUrl}`
        : "";

      setNotice(
        `${res.data.message || copy.accountCreated}${devLink}`,
        "success"
      );
    } catch (error) {
      setNotice(
        error.response?.data?.message || copy.signupFailed,
        "error"
      );
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
      setNotice(
        error.response?.data?.message || copy.googleFailed,
        "error"
      );
    }
  };

  return (
    <div className="signupModalOverlay" onClick={onClose}>
      <div
        className="signupModal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="signup-modal-title"
      >
        <button
          className="signupModalClose"
          onClick={onClose}
          aria-label="Close signup modal"
          type="button"
        >
          X
        </button>

        <h2 id="signup-modal-title" className="signupModalTitle">
          {copy.title}
        </h2>

        <p className="signupModalSubtitle">
          {copy.subtitle}
        </p>

        <form className="signupForm" onSubmit={handleEmailSignup}>
          <label className="signupLabel" htmlFor="signup-name">
            {copy.fullName}
          </label>
          <input
            id="signup-name"
            className="signupInput"
            type="text"
            placeholder={copy.yourName}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNotice("");
            }}
          />

          <label className="signupLabel" htmlFor="signup-email">
            {copy.email}
          </label>
          <input
            id="signup-email"
            className="signupInput"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setNotice("");
            }}
          />

          <label className="signupLabel" htmlFor="signup-password">
            {copy.password}
          </label>
          <input
            id="signup-password"
            className="signupInput"
            type="password"
            placeholder={copy.minChars}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setNotice("");
            }}
          />

          {message && (
            <p className={`signupMessage ${messageTone}`}>{message}</p>
          )}

          <button className="signupEmailBtn" type="submit" disabled={loading}>
            {loading ? copy.creating : copy.signupEmail}
          </button>
        </form>

        <div className="signupDivider">
          <span>{copy.or}</span>
        </div>

        <div className="signupSocials">
          <div className="googleLoginWrap">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setNotice("Google Login Failed", "error")}
              theme="outline"
              size="large"
              text="continue_with"
              shape="pill"
              width={320}
            />
          </div>
        </div>

        <p className="signupLoginText">
          {copy.alreadyHave}{" "}
          <button type="button" onClick={onLoginClick}>
            {copy.login}
          </button>
        </p>

        <p className="signupTermsText">
          {copy.terms}{" "}
          <a href="/">{copy.termsLink}</a> and <a href="/">{copy.privacyLink}</a>.
        </p>
      </div>
    </div>
  );
}
