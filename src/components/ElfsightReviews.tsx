import { useEffect } from 'react';

const ELFSIGHT_SCRIPT_ID = 'elfsight-platform-script';
const DEFAULT_ELFSIGHT_WIDGET_ID = 'ea49e18e-7d82-43dc-9340-4b6616909e32';

export default function ElfsightReviews() {
  const widgetId = (
    import.meta.env.VITE_ELFSIGHT_REVIEWS_WIDGET_ID || DEFAULT_ELFSIGHT_WIDGET_ID
  ).trim();

  useEffect(() => {
    if (!widgetId || document.getElementById(ELFSIGHT_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = ELFSIGHT_SCRIPT_ID;
    script.src = 'https://elfsightcdn.com/platform.js';
    script.async = true;
    script.dataset.elfsightPlatform = 'true';
    document.body.appendChild(script);
  }, [widgetId]);

  if (!widgetId) {
    return (
      <div className="elfsight-reviews-placeholder" role="status">
        Le recensioni dei nostri clienti saranno visibili qui a breve.
      </div>
    );
  }

  return (
    <div className="elfsight-reviews-shell">
      <div className={`elfsight-app-${widgetId}`} data-elfsight-app-lazy />
    </div>
  );
}
