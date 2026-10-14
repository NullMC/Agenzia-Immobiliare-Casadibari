import { useEffect } from 'react';

const ELFSIGHT_SCRIPT_ID = 'elfsight-platform-script';

export default function ElfsightReviews() {
  const widgetId = (import.meta.env.VITE_ELFSIGHT_REVIEWS_WIDGET_ID || '').trim();

  useEffect(() => {
    if (!widgetId || document.getElementById(ELFSIGHT_SCRIPT_ID)) return;

    const script = document.createElement('script');
    script.id = ELFSIGHT_SCRIPT_ID;
    script.src = 'https://static.elfsight.com/platform/platform.js';
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
