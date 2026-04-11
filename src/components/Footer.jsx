import { useMemo, useState } from "react";
import "./footer.css";

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="footer__socialIcon">
      <path
        fill="currentColor"
        d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.7V4.9c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3V11H8v3h2.4v8h3.1z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="footer__socialIcon">
      <path
        fill="currentColor"
        d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4zm0 2.2A1.8 1.8 0 0 0 5.2 7v10c0 1 .8 1.8 1.8 1.8h10c1 0 1.8-.8 1.8-1.8V7c0-1-.8-1.8-1.8-1.8H7zm10.5 1.3a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2zM12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="footer__socialIcon">
      <path
        fill="currentColor"
        d="M14.8 3c.3 1.8 1.4 3.2 3.1 3.9.7.3 1.4.4 2.1.4v3a8.2 8.2 0 0 1-2.7-.4v5.4c0 3.3-2.7 6-6 6s-6-2.7-6-6 2.7-6 6-6c.3 0 .7 0 1 .1v3.1a3 3 0 1 0 2 2.8V3h2.5z"
      />
    </svg>
  );
}

export default function Footer({ language = "en" }) {
  const [activeTab, setActiveTab] = useState("contact");
  const [showAll, setShowAll] = useState(false);

  const copy = {
    en: {
      tabs: {
        contact: "CONTACT",
        states: "STATES",
        cities: "CITIES",
        airports: "AIRPORTS",
      },
      contact: [
        { type: "social", label: "Facebook", icon: <FacebookIcon /> },
        { type: "social", label: "Instagram", icon: <InstagramIcon /> },
        { type: "social", label: "TikTok", icon: <TikTokIcon /> },
        { type: "text", label: "Email support" },
        { type: "text", label: "Customer help" },
        { type: "text", label: "Host support" },
        { type: "text", label: "Business inquiries" },
        { type: "text", label: "Trust & safety" },
        { type: "text", label: "Community support" },
        { type: "text", label: "Report an issue" },
      ],
      states: ["Kosovo", "Albania", "North Macedonia"],
      cities: [
        "Pristina",
        "Ferizaj",
        "Prizren",
        "Peja",
        "Gjilan",
        "Mitrovica",
        "Tirana",
        "Durres",
        "Vlore",
        "Shkoder",
        "Skopje",
        "Tetovo",
        "Kumanovo",
        "Ohrid",
        "Struga",
      ],
      airports: [
        "Pristina International Airport (PRN)",
        "Tirana International Airport (TIA)",
        "Skopje International Airport (SKP)",
        "Kukes International Airport (KFZ)",
        "Ohrid St. Paul the Apostle Airport (OHD)",
      ],
      showLess: "Show less",
      showMore: "Show more",
      about: "About",
      howItWorks: "How it works",
      trust: "Trust & safety",
      policies: "Policies",
      careers: "Careers",
      locations: "Locations",
      explore: "Explore",
      whyVeturo: "Why choose Veturo",
      airportRentals: "Airport rentals",
      cityRentals: "City rentals",
      helpCenter: "Help center",
      contactSupport: "Contact support",
      hosting: "Hosting",
      listCar: "List your car",
      becomeHost: "Become a host",
      hostRules: "Host rules",
      insurance: "Insurance",
      hostTips: "Host tips",
      copyright: "© 2026 Veturo, Inc. Terms · Privacy · Cookies",
    },
    al: {
      tabs: {
        contact: "KONTAKT",
        states: "SHTETET",
        cities: "QYTETET",
        airports: "AEROPORTET",
      },
      contact: [
        { type: "social", label: "Facebook", icon: <FacebookIcon /> },
        { type: "social", label: "Instagram", icon: <InstagramIcon /> },
        { type: "social", label: "TikTok", icon: <TikTokIcon /> },
        { type: "text", label: "Suporti me email" },
        { type: "text", label: "Ndihma per klientet" },
        { type: "text", label: "Ndihma per hostet" },
        { type: "text", label: "Kerksa biznesi" },
        { type: "text", label: "Besimi dhe siguria" },
        { type: "text", label: "Suporti i komunitetit" },
        { type: "text", label: "Raporto nje problem" },
      ],
      states: ["Kosove", "Shqiperi", "Maqedonia e Veriut"],
      cities: [
        "Prishtine",
        "Ferizaj",
        "Prizren",
        "Peje",
        "Gjilan",
        "Mitrovice",
        "Tirane",
        "Durres",
        "Vlore",
        "Shkoder",
        "Shkup",
        "Tetove",
        "Kumanove",
        "Ohër",
        "Struge",
      ],
      airports: [
        "Aeroporti Nderkombetar i Prishtines (PRN)",
        "Aeroporti Nderkombetar i Tiranes (TIA)",
        "Aeroporti Nderkombetar i Shkupit (SKP)",
        "Aeroporti Nderkombetar i Kukesit (KFZ)",
        "Aeroporti Ohër Shën Pali Apostull (OHD)",
      ],
      showLess: "Shfaq me pak",
      showMore: "Shfaq me shume",
      about: "Rreth nesh",
      howItWorks: "Si funksionon",
      trust: "Besimi dhe siguria",
      policies: "Politikat",
      careers: "Karriera",
      locations: "Lokacionet",
      explore: "Eksploro",
      whyVeturo: "Pse ta zgjedhesh Veturo",
      airportRentals: "Qira ne aeroporte",
      cityRentals: "Qira ne qytete",
      helpCenter: "Qendra e ndihmes",
      contactSupport: "Kontakto suportin",
      hosting: "Hosting",
      listCar: "Listo veturen tende",
      becomeHost: "Behu host",
      hostRules: "Rregullat e hostit",
      insurance: "Sigurimi",
      hostTips: "Keshilla per hostin",
      copyright: "© 2026 Veturo, Inc. Kushtet · Privatesia · Cookies",
    },
  }[language];

  const tabs = [
    { id: "contact", label: copy.tabs.contact },
    { id: "states", label: copy.tabs.states },
    { id: "cities", label: copy.tabs.cities },
    { id: "airports", label: copy.tabs.airports },
  ];

  const content = {
    contact: copy.contact,
    states: copy.states.map((label) => ({ type: "text", label })),
    cities: copy.cities.map((label) => ({ type: "text", label })),
    airports: copy.airports.map((label) => ({ type: "text", label })),
  };

  const visibleItems = useMemo(() => {
    const items = content[activeTab] || [];
    return showAll ? items : items.slice(0, 10);
  }, [activeTab, showAll]);

  const shouldShowToggle = (content[activeTab] || []).length > 10;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setShowAll(false);
  };

  return (
    <footer className="footer">
      <div className="footer__container">
        <div className="footer__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`footer__tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => handleTabChange(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="footer__grid">
          {visibleItems.map((item, i) => (
            <span
              key={i}
              className={`footer__link ${
                item.type === "social" ? "footer__linkSocial" : ""
              }`}
            >
              {item.icon ? item.icon : null}
              <span>{item.label}</span>
            </span>
          ))}
        </div>

        {shouldShowToggle && (
          <button
            type="button"
            className="footer__more"
            onClick={() => setShowAll((prev) => !prev)}
          >
            {showAll ? copy.showLess : copy.showMore}
          </button>
        )}

        <div className="footer__bottom">
          <div className="footer__col">
            <h4>Veturo</h4>
            <span>{copy.about}</span>
            <span>{copy.howItWorks}</span>
            <span>{copy.trust}</span>
            <span>{copy.policies}</span>
            <span>{copy.careers}</span>
          </div>

          <div className="footer__col">
            <h4>{copy.locations}</h4>
            <span>{copy.states[0]}</span>
            <span>{copy.states[1]}</span>
            <span>{copy.states[2]}</span>
            <span>{copy.cities[0]}</span>
            <span>{copy.cities[6]}</span>
          </div>

          <div className="footer__col">
            <h4>{copy.explore}</h4>
            <span>{copy.whyVeturo}</span>
            <span>{copy.airportRentals}</span>
            <span>{copy.cityRentals}</span>
            <span>{copy.helpCenter}</span>
            <span>{copy.contactSupport}</span>
          </div>

          <div className="footer__col">
            <h4>{copy.hosting}</h4>
            <span>{copy.listCar}</span>
            <span>{copy.becomeHost}</span>
            <span>{copy.hostRules}</span>
            <span>{copy.insurance}</span>
            <span>{copy.hostTips}</span>
          </div>
        </div>

        <div className="footer__copyright">{copy.copyright}</div>
      </div>
    </footer>
  );
}
