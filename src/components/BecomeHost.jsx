import { useState } from "react";
import { Link } from "react-router-dom";
import "./becomeHost.css";

function BecomeHost({ language = "en" }) {
  const [fullName, setFullName] = useState("");
  const [hostType, setHostType] = useState("person");
  const [phone, setPhone] = useState("");

  const copy = {
    en: {
      eyebrow: "Veturo Host Application",
      title: "Become a host",
      subtitle:
        "Fill in your details and contact us directly on WhatsApp for manual verification. After approval from admin or superadmin, the host can enter the host dashboard.",
      fullName: "Full name",
      fullNamePlaceholder: "Write your first and last name",
      hostType: "Business or person?",
      person: "Person",
      business: "Business",
      phone: "Phone number",
      contact: "Contact on WhatsApp",
      approved: "Already approved? Go to Host Login",
      note: "Manual verification on WhatsApp.",
      typeValue: {
        person: "Person",
        business: "Business",
      },
    },
    al: {
      eyebrow: "Aplikimi per Host ne Veturo",
      title: "Behu host",
      subtitle:
        "Ploteso te dhenat dhe na kontakto direkt ne WhatsApp per verifikim manual. Pas aprovimit nga admin ose superadmin, hosti mund te hyje ne host dashboard.",
      fullName: "Emri mbiemri",
      fullNamePlaceholder: "Shkruaj emrin dhe mbiemrin",
      hostType: "Biznes apo person?",
      person: "Person",
      business: "Biznes",
      phone: "Numri i telefonit",
      contact: "Kontakto ne WhatsApp",
      approved: "Je aprovuar? Shko te Host Login",
      note: "Verifikimi manual ne WhatsApp.",
      typeValue: {
        person: "Person",
        business: "Biznes",
      },
    },
  }[language];

  const whatsappNumber = "38344111222";

  const buildWhatsappLink = () => {
    const typeText = copy.typeValue[hostType];
    const text = `Pershendetje Veturo, dua te behem host.%0A%0AEmri dhe mbiemri: ${fullName}%0ALloji: ${typeText}%0ANumri kontaktues: ${phone}`;
    return `https://wa.me/${whatsappNumber}?text=${text}`;
  };

  return (
    <section className="becomeHostPage">
      <div className="becomeHostCard">
        <p className="becomeHostEyebrow">{copy.eyebrow}</p>
        <h1 className="becomeHostTitle">{copy.title}</h1>
        <p className="becomeHostSubtitle">{copy.subtitle}</p>

        <div className="becomeHostForm">
          <div className="becomeHostField">
            <label>{copy.fullName}</label>
            <input
              type="text"
              placeholder={copy.fullNamePlaceholder}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="becomeHostField">
            <label>{copy.hostType}</label>
            <div className="becomeHostOptions">
              <button
                type="button"
                className={hostType === "person" ? "hostOption active" : "hostOption"}
                onClick={() => setHostType("person")}
              >
                {copy.person}
              </button>

              <button
                type="button"
                className={hostType === "business" ? "hostOption active" : "hostOption"}
                onClick={() => setHostType("business")}
              >
                {copy.business}
              </button>
            </div>
          </div>

          <div className="becomeHostField">
            <label>{copy.phone}</label>
            <input
              type="text"
              placeholder="+383 44 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <a
            href={buildWhatsappLink()}
            target="_blank"
            rel="noreferrer"
            className={`becomeHostWhatsapp ${
              !fullName.trim() || !phone.trim() ? "disabled" : ""
            }`}
            onClick={(e) => {
              if (!fullName.trim() || !phone.trim()) {
                e.preventDefault();
              }
            }}
          >
            {copy.contact}
          </a>

          <Link to="/hosts" className="becomeHostLoginLink">
            {copy.approved}
          </Link>

          <p className="becomeHostNote">{copy.note}</p>
        </div>
      </div>
    </section>
  );
}

export default BecomeHost;
