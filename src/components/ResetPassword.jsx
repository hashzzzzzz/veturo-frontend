import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./resetPassword.css";

import API_URL from "../config/api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [tone, setTone] = useState("info");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password || password.length < 6) {
      setTone("error");
      setMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setTone("error");
      setMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setTone("info");
      setMessage("");

      const res = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      if (data.token && data.user) {
        if (["host", "admin", "superadmin"].includes(data.user.role)) {
          localStorage.setItem("hostToken", data.token);
          localStorage.setItem("hostUser", JSON.stringify(data.user));
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("showWelcomePopup", "true");
      }

      setTone("success");
      setMessage(data.message || "Password updated successfully.");

      setTimeout(() => {
        if (data.user?.role === "host") {
          navigate("/hosts/dashboard", { replace: true });
          return;
        }

        if (["admin", "superadmin"].includes(data.user?.role)) {
          navigate("/admin-panel", { replace: true });
          return;
        }

        navigate("/", { replace: true });
      }, 1800);
    } catch (err) {
      setTone("error");
      setMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="resetPasswordPage">
      <div className="resetPasswordCard">
        <h1>Set new password</h1>
        <p>Choose a new password, then continue on Veturo.</p>

        <form className="resetPasswordForm" onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

          {message && <p className={`resetPasswordMessage ${tone}`}>{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save new password"}
          </button>
        </form>
      </div>
    </section>
  );
}
