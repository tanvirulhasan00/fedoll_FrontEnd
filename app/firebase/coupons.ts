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

export type CouponDiscountType =
  | "percentage"
  | "fixed_amount"
  | "free_shipping"
  | "shipping_discount";

export interface CouponItem {
  id: string;
  code: string;
  discountType?: CouponDiscountType;
  discountPercent?: number;
  discountAmount?: number;
  minSpend: number;
  description: string;
  active: boolean;
  usedCount: number;
  expiresAt: string;
}

export const initialCoupons: CouponItem[] = [
  {
    id: "coup-free-delivery",
    code: "FREEDELIVERY",
    discountType: "free_shipping",
    discountPercent: 0,
    discountAmount: 0,
    minSpend: 2000,
    description: "100% Free Nationwide Courier Delivery on orders over ৳2,000.",
    active: true,
    usedCount: 84,
    expiresAt: "2026-12-31",
  },
  {
    id: "coup-ship-50",
    code: "SHIP50",
    discountType: "shipping_discount",
    discountPercent: 0,
    discountAmount: 50,
    minSpend: 1000,
    description: "৳50 off courier delivery charges across all districts.",
    active: true,
    usedCount: 42,
    expiresAt: "2026-12-31",
  },
  {
    id: "coup-1",
    code: "SILKENDRIFT2026",
    discountType: "percentage",
    discountPercent: 15,
    discountAmount: 0,
    minSpend: 1500,
    description: "15% off on all outerwear and signature winter selvedge denim.",
    active: true,
    usedCount: 142,
    expiresAt: "2026-12-31",
  },
  {
    id: "coup-2",
    code: "WELCOME10",
    discountType: "percentage",
    discountPercent: 10,
    discountAmount: 0,
    minSpend: 1000,
    description: "Welcome discount for newly registered SilkenDrift customers.",
    active: true,
    usedCount: 289,
    expiresAt: "2026-12-31",
  },
  {
    id: "coup-3",
    code: "VIP20",
    discountType: "percentage",
    discountPercent: 20,
    discountAmount: 0,
    minSpend: 5000,
    description: "VIP privileged discount for orders exceeding ৳5,000.",
    active: true,
    usedCount: 57,
    expiresAt: "2026-11-30",
  },
];

const LOCAL_STORAGE_COUPONS_KEY = "fedoll_store_coupons_v1";

const getLocalCoupons = (): CouponItem[] => {
  if (typeof window === "undefined") return initialCoupons;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COUPONS_KEY);
    return raw ? JSON.parse(raw) : initialCoupons;
  } catch {
    return initialCoupons;
  }
};

const saveLocalCoupons = (coupons: CouponItem[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_COUPONS_KEY, JSON.stringify(coupons));
  } catch (err) {
    console.warn("Could not save coupons locally:", err);
  }
};

import { sanitizeForFirestore } from "./firestore";

/**
 * Fetch all promo coupons from Cloud Firestore
 */
export const fetchCouponsFromFirestore = async (): Promise<CouponItem[]> => {
  try {
    const colRef = collection(db, "coupons");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as DocumentData),
      })) as CouponItem[];
      saveLocalCoupons(list);
      return list;
    }

    // Auto-seed initial coupons to Firestore if database collection is empty
    for (const c of initialCoupons) {
      try {
        await setDoc(
          doc(db, "coupons", c.id),
          sanitizeForFirestore({ ...c, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
          { merge: true }
        );
      } catch (seedErr) {
        console.warn("Failed to seed coupon:", seedErr);
      }
    }
    saveLocalCoupons(initialCoupons);
    return initialCoupons;
  } catch (err) {
    console.warn("Could not fetch coupons from Firestore:", err);
  }
  return getLocalCoupons();
};

/**
 * Save or update a coupon in Cloud Firestore
 */
export const saveCouponToFirestore = async (
  coupon: CouponItem
): Promise<CouponItem> => {
  try {
    const docRef = doc(db, "coupons", coupon.id);
    await setDoc(
      docRef,
      sanitizeForFirestore({
        ...coupon,
        updatedAt: serverTimestamp(),
      }),
      { merge: true }
    );
  } catch (err) {
    console.error("Could not save coupon to Firestore:", err);
  }

  const existing = getLocalCoupons();
  const index = existing.findIndex((c) => c.id === coupon.id);
  const updated =
    index >= 0
      ? existing.map((c) => (c.id === coupon.id ? coupon : c))
      : [coupon, ...existing];

  saveLocalCoupons(updated);
  return coupon;
};

/**
 * Delete a coupon from Cloud Firestore
 */
export const deleteCouponFromFirestore = async (id: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "coupons", id));
  } catch (err) {
    console.error("Could not delete coupon from Firestore:", err);
  }

  const existing = getLocalCoupons();
  const updated = existing.filter((c) => c.id !== id);
  saveLocalCoupons(updated);
  return true;
};

