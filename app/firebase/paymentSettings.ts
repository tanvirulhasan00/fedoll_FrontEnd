import { doc, getDoc, setDoc, serverTimestamp, type DocumentData } from "firebase/firestore";
import { db } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";

export interface BkashSettings {
  enabled: boolean;
  isSandbox: boolean; // true = Sandbox Developer Testing, false = Live Production
  appKey: string;
  appSecret: string;
  username: string;
  password: string;
  merchantNumber: string;
  lastTestedAt?: string;
  lastTestStatus?: "success" | "error";
  lastTestMessage?: string;
}

export interface CodSettings {
  enabled: boolean;
  additionalFee: number;
}

export interface PaymentGatewaySettings {
  bkash: BkashSettings;
  cod: CodSettings;
  updatedAt?: string;
}

/**
 * Official default bKash Developer Sandbox credentials.
 * Works out-of-the-box for tokenized checkout testing.
 */
export const defaultBkashSandboxCredentials: BkashSettings = {
  enabled: true,
  isSandbox: true,
  appKey: "4f6o0cjiki2rfm34kfdadl1eqq",
  appSecret: "2is7hdktrekvrbljjh44ll3d9l1dtjo4pasmjvs5vl5qr3fug4b",
  username: "sandboxTokenizedUser02",
  password: "sandboxTokenizedUser02@12345",
  merchantNumber: "01770618575",
  lastTestedAt: undefined,
  lastTestStatus: undefined,
  lastTestMessage: undefined,
};

export const defaultPaymentSettings: PaymentGatewaySettings = {
  bkash: defaultBkashSandboxCredentials,
  cod: {
    enabled: true,
    additionalFee: 0,
  },
};

const LOCAL_STORAGE_KEY = "fedoll_payment_gateway_settings_v1";
let memoryCachedSettings: PaymentGatewaySettings | null = null;

/**
 * Fetch payment gateway settings from Firestore doc `store_settings/payment`.
 * Falls back to local storage and default sandbox settings.
 */
export const fetchPaymentSettings = async (): Promise<PaymentGatewaySettings> => {
  if (memoryCachedSettings) {
    return memoryCachedSettings;
  }

  // 1. Check local storage cache for instant rendering
  if (typeof window !== "undefined") {
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        memoryCachedSettings = JSON.parse(local);
      }
    } catch {
      // Ignore parse error
    }
  }

  // 2. Fetch from Firestore
  try {
    const docRef = doc(db, "store_settings", "payment");
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      const data = snap.data() as DocumentData;
      const merged: PaymentGatewaySettings = {
        bkash: {
          ...defaultPaymentSettings.bkash,
          ...(data.bkash || {}),
        },
        cod: {
          ...defaultPaymentSettings.cod,
          ...(data.cod || {}),
        },
        updatedAt: data.updatedAt || undefined,
      };

      memoryCachedSettings = merged;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
      }
      return merged;
    }
  } catch (err) {
    console.warn("Could not fetch payment settings from Firestore, using defaults:", err);
  }

  return memoryCachedSettings || defaultPaymentSettings;
};

/**
 * Save updated payment settings to Firestore doc `store_settings/payment`.
 */
export const savePaymentSettings = async (
  settings: PaymentGatewaySettings
): Promise<void> => {
  const clean = sanitizeForFirestore({
    ...settings,
    updatedAt: new Date().toISOString(),
    firestoreUpdatedAt: serverTimestamp(),
  });

  const docRef = doc(db, "store_settings", "payment");
  await setDoc(docRef, clean, { merge: true });

  memoryCachedSettings = settings;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }
};

