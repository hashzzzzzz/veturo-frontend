import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "./verifyEmail.css";

const API_URL = "http://localhost:5000/api";

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("We are verifying your email.");

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

        <div className="verifyEmailActions">
          <Link to="/">Go to login</Link>
          <Link to="/hosts">Host login</Link>
        </div>
      </div>
    </section>
  );
}
