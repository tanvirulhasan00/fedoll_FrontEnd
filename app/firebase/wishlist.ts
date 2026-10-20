import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

/**
 * Fetch wishlist product IDs for a given user from Cloud Firestore
 */
export const fetchUserWishlistFromFirestore = async (
  userId: string
): Promise<string[]> => {
  if (!userId) return [];
  try {
    // 1. Try from users/{userId}
    const userRef = doc(db, "users", userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data() as DocumentData;
      if (Array.isArray(data.wishlist)) {
        return data.wishlist;
      }
    }

    // 2. Fallback to dedicated wishlists collection wishlists/{userId}
    const wishlistRef = doc(db, "wishlists", userId);
    const wSnap = await getDoc(wishlistRef);
    if (wSnap.exists()) {
      const wData = wSnap.data() as DocumentData;
      if (Array.isArray(wData.productIds)) {
        return wData.productIds;
      }
    }
  } catch (err) {
    console.warn("Could not fetch user wishlist from Firestore:", err);
  }
  return [];
};

/**
 * Save user wishlist product IDs array to Cloud Firestore
 */
export const saveUserWishlistToFirestore = async (
  userId: string,
  wishlistIds: string[]
): Promise<void> => {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    await setDoc(
      userRef,
      {
        wishlist: wishlistIds,
        wishlistUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    // Also sync to wishlists/{userId} collection for redundancy & query efficiency
    const wishlistRef = doc(db, "wishlists", userId);
    await setDoc(
      wishlistRef,
      {
        userId,
        productIds: wishlistIds,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not save wishlist to Firestore:", err);
  }
};

/**
 * Toggle a product ID in user's wishlist in Cloud Firestore
 */
export const toggleProductInWishlistFirestore = async (
  userId: string,
  productId: string
): Promise<string[]> => {
  if (!userId || !productId) return [];
  const current = await fetchUserWishlistFromFirestore(userId);
  let updated: string[];
  if (current.includes(productId)) {
    updated = current.filter((id) => id !== productId);
  } else {
    updated = [...current, productId];
  }
  await saveUserWishlistToFirestore(userId, updated);
  return updated;
};
