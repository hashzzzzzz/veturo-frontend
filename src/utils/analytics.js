export const GA_MEASUREMENT_ID = "G-SKH2T2S35D";

export function trackPageView(path) {
  if (typeof window === "undefined") return;

  window.gtag?.("config", GA_MEASUREMENT_ID, {
    page_path: path || window.location.pathname + window.location.search,
  });
}

export function trackEvent(eventName, params = {}) {
  if (typeof window === "undefined") return;

  window.gtag?.("event", eventName, params);
}
