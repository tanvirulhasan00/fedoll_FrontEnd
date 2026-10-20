import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface ShippingProvider {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  active: boolean;
  insideDhakaRate: number;
  subDhakaRate: number;
  outsideDhakaRate: number;
  deliveryTimeInside: string;
  deliveryTimeOutside: string;
  trackingUrlPattern: string;
  hotline: string;
  pickupHub: string;
  cashOnDeliveryFeePercent: number;
  isDefault?: boolean;
}

export interface ShippingSettings {
  freeShippingThreshold: number;
  defaultProviderId: string;
  standardInsideDhaka: number;
  standardOutsideDhaka: number;
  expressDeliveryFee: number;
  allowCashOnDelivery: boolean;
  allowBkash: boolean;
  deliveryNotice?: string;
}

export const initialShippingProviders: ShippingProvider[] = [
  {
    id: "steadfast",
    name: "Steadfast Courier",
    slug: "steadfast",
    active: true,
    insideDhakaRate: 70,
    subDhakaRate: 100,
    outsideDhakaRate: 130,
    deliveryTimeInside: "24-48 Hours",
    deliveryTimeOutside: "2-4 Days",
    trackingUrlPattern: "https://steadfast.com.bd/tracking/{tracking}",
    hotline: "+880 9678-000999",
    pickupHub: "Uttara Hub, Dhaka",
    cashOnDeliveryFeePercent: 0,
    isDefault: true,
  },
  {
    id: "pathao",
    name: "Pathao Express",
    slug: "pathao",
    active: true,
    insideDhakaRate: 80,
    subDhakaRate: 110,
    outsideDhakaRate: 140,
    deliveryTimeInside: "Same Day / Next Day",
    deliveryTimeOutside: "48-72 Hours",
    trackingUrlPattern: "https://merchant.pathao.com/tracking?consignment_id={tracking}",
    hotline: "+880 9678-100800",
    pickupHub: "Banani Dispatch Center, Dhaka",
    cashOnDeliveryFeePercent: 0.5,
  },
  {
    id: "redx",
    name: "RedX Logistics",
    slug: "redx",
    active: true,
    insideDhakaRate: 70,
    subDhakaRate: 100,
    outsideDhakaRate: 130,
    deliveryTimeInside: "24-48 Hours",
    deliveryTimeOutside: "2-3 Days",
    trackingUrlPattern: "https://redx.com.bd/track-order/?trackingId={tracking}",
    hotline: "+880 9610-007339",
    pickupHub: "Tejgaon Industrial Area Hub, Dhaka",
    cashOnDeliveryFeePercent: 1,
  },
  {
    id: "paperfly",
    name: "Paperfly Wings",
    slug: "paperfly",
    active: false,
    insideDhakaRate: 60,
    subDhakaRate: 90,
    outsideDhakaRate: 120,
    deliveryTimeInside: "48 Hours",
    deliveryTimeOutside: "3-5 Days",
    trackingUrlPattern: "https://paperfly.com.bd/tracking.php?code={tracking}",
    hotline: "+880 9666-774433",
    pickupHub: "Mirpur Dispatch Hub, Dhaka",
    cashOnDeliveryFeePercent: 0,
  },
];

export const defaultShippingSettings: ShippingSettings = {
  freeShippingThreshold: 2500,
  defaultProviderId: "steadfast",
  standardInsideDhaka: 70,
  standardOutsideDhaka: 130,
  expressDeliveryFee: 150,
  allowCashOnDelivery: true,
  allowBkash: true,
  deliveryNotice: "Nationwide express delivery with zero doorstep transit damages.",
};

const LOCAL_STORAGE_SHIPPING_KEY = "fedoll_shipping_providers_v1";
const LOCAL_STORAGE_SETTINGS_KEY = "fedoll_shipping_settings_v1";

const getLocalProviders = (): ShippingProvider[] => {
  if (typeof window === "undefined") return initialShippingProviders;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHIPPING_KEY);
    return raw ? JSON.parse(raw) : initialShippingProviders;
  } catch {
    return initialShippingProviders;
  }
};

const saveLocalProviders = (providers: ShippingProvider[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_SHIPPING_KEY, JSON.stringify(providers));
  } catch (err) {
    console.warn("Could not cache shipping providers locally:", err);
  }
};

import { sanitizeForFirestore } from "./firestore";

/**
 * Fetch all shipping providers from Cloud Firestore
 */
export const fetchShippingProviders = async (): Promise<ShippingProvider[]> => {
  try {
    const colRef = collection(db, "shipping_providers");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as ShippingProvider[];
      saveLocalProviders(list);
      return list;
    }

    // Auto-seed initial shipping providers to Firestore if collection is empty
    for (const p of initialShippingProviders) {
      try {
        await setDoc(
          doc(db, "shipping_providers", p.id),
          sanitizeForFirestore({ ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
          { merge: true }
        );
      } catch (seedErr) {
        console.warn("Failed to seed shipping provider:", seedErr);
      }
    }
    saveLocalProviders(initialShippingProviders);
    return initialShippingProviders;
  } catch (err) {
    console.warn("Using local shipping providers:", err);
  }
  return getLocalProviders();
};

/**
 * Save / Update a shipping provider in Cloud Firestore
 */
export const saveShippingProvider = async (
  provider: ShippingProvider
): Promise<ShippingProvider> => {
  try {
    const docRef = doc(db, "shipping_providers", provider.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...provider,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Could not save shipping provider to Firestore:", err);
  }

  const existing = getLocalProviders();
  const index = existing.findIndex((p) => p.id === provider.id);
  const updated =
    index >= 0
      ? existing.map((p) => (p.id === provider.id ? provider : p))
      : [...existing, provider];

  saveLocalProviders(updated);
  return provider;
};

/**
 * Delete a shipping provider from Cloud Firestore
 */
export const deleteShippingProvider = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "shipping_providers", id));
  } catch (err) {
    console.error("Could not delete shipping provider in Firestore:", err);
  }
  const existing = getLocalProviders();
  const updated = existing.filter((p) => p.id !== id);
  saveLocalProviders(updated);
  return true;
};

/**
 * Fetch overall shipping settings from Cloud Firestore
 */
export const fetchShippingSettings = async (): Promise<ShippingSettings> => {
  try {
    const docRef = doc(db, "store_settings", "shipping");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as ShippingSettings;
    }

    // Auto-seed default shipping settings to Firestore
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...defaultShippingSettings, updatedAt: serverTimestamp() }),
      { merge: true }
    );
    return defaultShippingSettings;
  } catch (err) {
    console.warn("Could not load shipping settings from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return defaultShippingSettings;
};

/**
 * Save shipping settings in Cloud Firestore
 */
export const saveShippingSettings = async (
  settings: ShippingSettings
): Promise<ShippingSettings> => {
  try {
    const docRef = doc(db, "store_settings", "shipping");
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...settings, updatedAt: serverTimestamp() }),
      { merge: true }
    );
  } catch (err) {
    console.error("Could not save shipping settings to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {}
  }
  return settings;
};

