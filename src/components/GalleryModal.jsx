import { useEffect, useState } from "react";
import "./galleryModal.css";

export default function GalleryModal({
  isOpen,
  images = [],
  startIndex = 0,
  onClose,
  onSelect,
}) {
  const [activeIndex, setActiveIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  if (!isOpen) return null;

  const handleSelect = (index) => {
    setActiveIndex(index);
    if (onSelect) onSelect(index);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="galleryModal" onClick={onClose}>
      <div
        className="galleryModal__content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="galleryModal__top">
          <h3>All photos</h3>
          <button type="button" className="galleryModal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="galleryModal__viewer">
          <button
            type="button"
            className="galleryModal__nav galleryModal__nav--left"
            onClick={handlePrev}
            aria-label="Previous photo"
          >
            ‹
          </button>

          <img
            src={images[activeIndex]}
            alt={`Car ${activeIndex + 1}`}
            className="galleryModal__bigImage"
          />

          <button
            type="button"
            className="galleryModal__nav galleryModal__nav--right"
            onClick={handleNext}
            aria-label="Next photo"
          >
            ›
          </button>

          <div className="galleryModal__counter">
            {activeIndex + 1} / {images.length}
          </div>
        </div>

        <div className="galleryModal__grid">
          {images.map((img, index) => (
            <button
              type="button"
              key={index}
              className={`galleryModal__item ${
                index === activeIndex ? "active" : ""
              }`}
              onClick={() => handleSelect(index)}
            >
              <img src={img} alt={`Car ${index + 1}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}