import { Link } from "react-router-dom";
import "./becomeHost.css";
import { trackEvent } from "../utils/analytics";

function BecomeHost({ language = "en" }) {
  const copy = {
    en: {
      eyebrow: "Veturo Host Network",
      title: "Have cars for rent?",
      subtitle:
        "Partner with Veturo and reach travelers looking for airport, city and monthly car rental across Kosovo, Albania and North Macedonia.",
      body:
        "Send us a WhatsApp message and our team will guide you through host approval, car listing, photos, pricing and availability.",
      contact: "Contact on WhatsApp",
      phone: "+383 45 820 096",
      approved: "Already approved? Go to Host Login",
      note: "Manual host verification is handled directly on WhatsApp.",
      whatsappText:
        "Pershendetje Veturo, dua te behem host dhe kam vetura per qera.",
    },
    al: {
      eyebrow: "Rrjeti i hosteve Veturo",
      title: "Ke vetura me qera?",
      subtitle:
        "Bashkohu me Veturo dhe arrij udhetare qe kerkojne qira ne aeroporte, qytete dhe qira mujore ne Kosove, Shqiperi dhe Maqedoni te Veriut.",
      body:
        "Na shkruaj ne WhatsApp dhe ekipi yne te udhezon per aprovimin si host, listimin e veturave, fotografite, cmimet dhe disponueshmerine.",
      contact: "Kontakto ne WhatsApp",
      phone: "+383 45 820 096",
      approved: "Je aprovuar? Shko te Host Login",
      note: "Verifikimi manual i hosteve behet direkt ne WhatsApp.",
      whatsappText:
        "Pershendetje Veturo, dua te behem host dhe kam vetura per qera.",
    },
  }[language];

  const whatsappNumber = "38345820096";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    copy.whatsappText
  )}`;

  return (
    <section className="becomeHostPage">
      <div className="becomeHostCard">
        <p className="becomeHostEyebrow">{copy.eyebrow}</p>
        <h1 className="becomeHostTitle">{copy.title}</h1>
        <p className="becomeHostSubtitle">{copy.subtitle}</p>

        <div className="becomeHostContactBox">
          <p>{copy.body}</p>
          <span>{copy.phone}</span>
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="becomeHostWhatsapp"
          onClick={() =>
            trackEvent("become_host_click", {
              source: "become_host_page",
              contact_method: "whatsapp",
            })
          }
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
            className="becomeHostWhatsappIcon"
          >
            <path d="M20.52 3.48A11.86 11.86 0 0 0 12.07 0C5.5 0 .16 5.33.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.32-1.66a11.86 11.86 0 0 0 5.75 1.47h.01c6.57 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.46-8.43ZM12.08 21.8h-.01a9.88 9.88 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.23-.37a9.84 9.84 0 0 1-1.52-5.27c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.81 9.81 0 0 1 2.9 7c0 5.45-4.44 9.89-9.89 9.89Zm5.42-7.42c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.14-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.06 2.88 1.2 3.08.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.61.71.22 1.36.19 1.88.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
          </svg>
          <span>{copy.contact}</span>
        </a>

        <Link to="/hosts" className="becomeHostLoginLink">
          {copy.approved}
        </Link>

        <p className="becomeHostNote">{copy.note}</p>
      </div>
    </section>
  );
}

export default BecomeHost;
