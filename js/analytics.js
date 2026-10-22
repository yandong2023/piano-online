// Shared channel for Studio events. Analytics must never interrupt playing.
export function track(eventName, params = {}) {
  try {
    if (typeof window.gtag !== 'function') return;
    let assetVersion = 'unknown';
    try {
      const script = document.querySelector('script[src*="/js/studio.js"]');
      assetVersion = new URL(script?.src, document.baseURI).searchParams.get('v') || 'unknown';
    } catch {}
    window.gtag('event', eventName, {
      ...params, event_version: 1, asset_version: assetVersion,
    });
  } catch {}
}
