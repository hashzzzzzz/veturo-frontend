import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./verifyEmail.css";

import API_URL from "../config/api";

export default function VerifyEmail({ language = "en" }) {
  const { token } = useParams();
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
        const res = await fetch(`${API_URL}/auth/verify-email/${token}`);
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(
            data.message || "This verification link is invalid or expired."
          );
        }

        if (!isMounted) return;

        setStatus("success");
        setMessage(data.message || "Email verified successfully. You can log in now.");
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
  }, [token]);

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
