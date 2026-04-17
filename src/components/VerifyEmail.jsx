import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import "./verifyEmail.css";

import API_URL from "../config/api";

export default function VerifyEmail({ language = "en" }) {
  const { token: tokenParam } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || tokenParam;
  const copy = {
    en: {
      invalidEmail: "Please enter a valid email.",
      resendPlaceholder: "Email address",
      resend: "Send fresh link",
      resending: "Sending...",
      resendSuccess:
        "If that account needs verification, we sent a fresh verification email.",
    },
    al: {
      invalidEmail: "Ju lutem shkruani nje email te sakte.",
      resendPlaceholder: "Adresa e emailit",
      resend: "Dergo link te ri",
      resending: "Duke derguar...",
      resendSuccess:
        "Nese ajo llogari ka nevoje per verifikim, derguam nje email te ri.",
    },
  }[language] || {};
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("We are verifying your email.");
  const [email, setEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    const verifyEmail = async () => {
      try {
        if (!token) {
          throw new Error("This verification link is invalid or expired.");
        }

        const res = await fetch(
          `${API_URL}/auth/verify-email?token=${encodeURIComponent(token)}`
        );
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.message || "This verification link is invalid or expired."
          );
        }

        if (!isMounted) return;

        if (data.token && data.user) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          sessionStorage.setItem("showWelcomePopup", "true");
        }

        setStatus("success");
        setMessage(data.message || "Email verified successfully. You are now logged in.");

        window.setTimeout(() => {
          navigate("/", { replace: true });
          window.location.reload();
        }, 1200);
      } catch (error) {
        if (!isMounted) return;

        setStatus("error");
        setMessage(
          error.message || "We could not verify your email right now."
        );
      }
    };

    verifyEmail();

    return () => {
      isMounted = false;
    };
  }, [navigate, token]);

  const handleResend = async (event) => {
    event.preventDefault();

    const safeEmail = email.trim();

    if (!safeEmail || !safeEmail.includes("@")) {
      setResendMessage(copy.invalidEmail);
      return;
    }

    try {
      setResending(true);
      setResendMessage("");

      const res = await fetch(`${API_URL}/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: safeEmail }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Could not resend verification email.");
      }

      const devLink = data.verificationUrl
        ? ` Dev link: ${data.verificationUrl}`
        : "";

      setResendMessage(`${data.message || copy.resendSuccess}${devLink}`);
    } catch (error) {
      setResendMessage(
        error.message || "Could not resend verification email."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <section className="verifyEmailPage">
      <div className="verifyEmailCard">
        <h1>Email verification</h1>
        <p className="verifyEmailLead">
          {status === "loading"
            ? "Just a second while we confirm your Veturo account."
            : status === "success"
            ? "Your account is ready."
            : "We could not complete the verification."}
        </p>

        <div className={`verifyEmailMessage ${status}`}>{message}</div>

        {status === "error" && (
          <form className="verifyEmailResend" onSubmit={handleResend}>
            <input
              type="email"
              value={email}
              placeholder={copy.resendPlaceholder}
              onChange={(e) => {
                setEmail(e.target.value);
                setResendMessage("");
              }}
            />
            <button type="submit" disabled={resending}>
              {resending ? copy.resending : copy.resend}
            </button>
            {resendMessage && <p>{resendMessage}</p>}
          </form>
        )}

        <div className="verifyEmailActions">
          <Link to="/">Go to login</Link>
          <Link to="/hosts">Host login</Link>
        </div>
      </div>
    </section>
  );
}
