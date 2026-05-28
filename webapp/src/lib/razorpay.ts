import type { Project } from './api';

type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: 'INR';
  name: string;
  description: string;
  notes: Record<string, string>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

export const getRazorpayKeyId = () => String(import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();

const loadRazorpayCheckout = () => new Promise<void>((resolve, reject) => {
  if (window.Razorpay) {
    resolve();
    return;
  }

  const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${CHECKOUT_SCRIPT}"]`);
  if (existingScript) {
    existingScript.addEventListener('load', () => resolve(), { once: true });
    existingScript.addEventListener('error', () => reject(new Error('Razorpay checkout could not be loaded.')), { once: true });
    return;
  }

  const script = document.createElement('script');
  script.src = CHECKOUT_SCRIPT;
  script.async = true;
  script.onload = () => resolve();
  script.onerror = () => reject(new Error('Razorpay checkout could not be loaded.'));
  document.body.appendChild(script);
});

export const openRazorpayCheckout = async ({
  project,
  amount,
  customerName,
  customerEmail,
  customerPhone,
}: {
  project: Project;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
}) => {
  const key = getRazorpayKeyId();
  if (!key) throw new Error('Razorpay test key is not configured. Add VITE_RAZORPAY_KEY_ID to the environment.');

  await loadRazorpayCheckout();
  const Razorpay = window.Razorpay;
  if (!Razorpay) throw new Error('Razorpay checkout is unavailable.');

  return new Promise<RazorpayResponse>((resolve, reject) => {
    const checkout = new Razorpay({
      key,
      amount: Math.round(amount * 100),
      currency: 'INR',
      name: 'Grihamm',
      description: `Escrow funding for ${project.id}`,
      notes: {
        project_id: project.id,
        home_type: project.homeType,
      },
      prefill: {
        name: customerName,
        email: customerEmail,
        contact: customerPhone,
      },
      theme: {
        color: '#b8a472',
      },
      handler: response => resolve(response),
      modal: {
        ondismiss: () => reject(new Error('Razorpay checkout was closed before payment completion.')),
      },
    });

    checkout.open();
  });
};
