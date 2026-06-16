/** Minimal Stripe.js loader — only used when the API reports live payments (real keys configured). */
declare global { interface Window { Stripe?: (key: string) => any; } }

let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (window.Stripe) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://js.stripe.com/v3/';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Stripe.js'));
    document.head.appendChild(s);
  });
  return scriptPromise;
}

/** Returns a Stripe instance, loading the SDK on first use. */
export async function getStripe(publishableKey: string): Promise<any> {
  await loadScript();
  if (!window.Stripe) throw new Error('Stripe unavailable');
  return window.Stripe(publishableKey);
}
