import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface StoreGeneralSettings {
  storeName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  headquartersAddress: string;
  currency: string;
  currencySymbol: string;
  vatRatePercent: number;
  announcementNotice: string;
  announcementActive: boolean;
  orderPrefix: string;
  supportHours: string;
  logoLightUrl?: string;
  logoDarkUrl?: string;
  logoUrl?: string;
  faviconUrl?: string;
}

export const defaultStoreSettings: StoreGeneralSettings = {
  storeName: "SilkenDrift Apparel Atelier",
  tagline: "Everyday High-Grade Export Quality Apparel",
  contactEmail: "support@silkendrift.com",
  contactPhone: "+880 1712-345678",
  headquartersAddress: "Sector 3, Uttara Model Town, Dhaka 1230, Bangladesh",
  currency: "BDT",
  currencySymbol: "৳",
  vatRatePercent: 0,
  announcementNotice: "Flash Winter Drop: Use voucher FREEDELIVERY for free delivery on orders over ৳2,000!",
  announcementActive: true,
  orderPrefix: "FED-",
  supportHours: "10:00 AM - 10:00 PM (Sat - Thu)",
  logoLightUrl: "",
  logoDarkUrl: "",
  logoUrl: "",
  faviconUrl: "",
};

import { sanitizeForFirestore } from "./firestore";

const LOCAL_STORAGE_STORE_KEY = "fedoll_store_general_settings_v1";

export const fetchStoreSettings = async (): Promise<StoreGeneralSettings> => {
  try {
    const docRef = doc(db, "store_settings", "general");
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as Partial<StoreGeneralSettings>;
      return {
        ...defaultStoreSettings,
        ...data,
      };
    }

    // Auto-seed default store settings to Firestore
    await setDoc(
      docRef,
      sanitizeForFirestore({ ...defaultStoreSettings, updatedAt: serverTimestamp() }),
      { merge: true }
    );
    return defaultStoreSettings;
  } catch (err) {
    console.warn("Could not fetch store settings from Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_STORE_KEY);
      if (raw) return { ...defaultStoreSettings, ...JSON.parse(raw) };
    } catch {}
  }

  return defaultStoreSettings;
};

export const saveStoreSettings = async (
  settings: StoreGeneralSettings
): Promise<StoreGeneralSettings> => {
  try {
    const docRef = doc(db, "store_settings", "general");
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...settings,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Could not save store settings to Firestore:", err);
  }

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_STORE_KEY, JSON.stringify(settings));
    } catch {}
  }

  return settings;
};

