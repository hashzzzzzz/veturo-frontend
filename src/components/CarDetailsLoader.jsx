import "./carDetailsLoader.css";

export default function CarDetailsLoader({
  title = "Your Veturo ride",
  language = "en",
  isClosing = false,
}) {
  const copy = {
    en: {
      eyebrow: "Veturo",
      text: "Getting your car ready.",
    },
    al: {
      eyebrow: "Veturo",
      text: "Po pergatisim veturen tuaj.",
    },
  }[language] || {};

  return (
    <div
      className={`carDetailsLoader ${isClosing ? "carDetailsLoader--closing" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="carDetailsLoader__backdrop" />

      <div className="carDetailsLoader__content">
        <div className="carDetailsLoader__stage">
          <div className="carDetailsLoader__road" />
          <div className="carDetailsLoader__glow" />

          <div className="carDetailsLoader__car" aria-hidden="true">
            <div className="carDetailsLoader__carTop" />
            <div className="carDetailsLoader__carBody" />
            <div className="carDetailsLoader__window carDetailsLoader__window--front" />
            <div className="carDetailsLoader__window carDetailsLoader__window--rear" />
            <div className="carDetailsLoader__wheel carDetailsLoader__wheel--left" />
            <div className="carDetailsLoader__wheel carDetailsLoader__wheel--right" />
            <div className="carDetailsLoader__beam" />
          </div>
        </div>

        <div className="carDetailsLoader__copy">
          <p className="carDetailsLoader__eyebrow">{copy.eyebrow}</p>
          <h1>{title}</h1>
          <p className="carDetailsLoader__text">
            {copy.text}
          </p>
        </div>

        <div className="carDetailsLoader__progress" aria-hidden="true">
          <span className="carDetailsLoader__progressBar" />
        </div>
      </div>
    </div>
  );
}
