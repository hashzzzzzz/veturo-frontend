import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./adminLogin.css";

import API_URL from "../config/api";

export default function AdminLogin({ setUser, language = "en" }) {
  const copy = {
    en: {
      wrongPassword: "This password is incorrect.",
      failedFetch: "Failed to fetch",
      title: "Admin login",
      subtitle: "Login as admin or superadmin",
      email: "Admin email",
      password: "Admin password",
      logging: "Logging in...",
      login: "Login",
    },
    al: {
      wrongPassword: "Ky fjalekalim eshte i pasakte.",
      failedFetch: "Lidhja deshtoi",
      title: "Hyrja e adminit",
      subtitle: "Hyni si admin ose superadmin",
      email: "Emaili i adminit",
      password: "Fjalekalimi i adminit",
      logging: "Duke u kycur...",
      login: "Hyr",
    },
  }[language] || {};
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: emailOrUsername,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Admin login failed");
      }

      if (!["admin", "superadmin"].includes(data.user?.role)) {
        throw new Error("This account is not allowed to access admin panel");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.setItem("showWelcomePopup", "true");

      if (setUser) {
        setUser(data.user);
      }

      navigate("/admin-panel");
    } catch (err) {
      setError(
        err.message === "Invalid credentials"
          ? copy.wrongPassword
          : err.message || copy.failedFetch
      );
      console.error("ADMIN LOGIN ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="adminLoginPage">
      <div className="adminLoginCard">
        <h1>{copy.title}</h1>
        <p>{copy.subtitle}</p>

        <form onSubmit={handleLogin} className="adminLoginForm">
          <input
            type="email"
            placeholder={copy.email}
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder={copy.password}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="adminError">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? copy.logging : copy.login}
          </button>
        </form>
      </div>
    </section>
  );
}
