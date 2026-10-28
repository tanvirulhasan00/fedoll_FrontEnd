import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase.config";
import { sanitizeForFirestore } from "./firestore";

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  userId?: string | null;
  userName: string;
  userEmail: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  images?: string[]; // Customer uploaded product photos
  verifiedPurchase: boolean;
  status: "published" | "pending" | "hidden";
  helpfulCount?: number;
  createdAt: string; // ISO date string
  updatedAt?: string;
  adminReply?: {
    text: string;
    repliedAt: string;
    repliedBy: string;
  } | null;
}

const REVIEWS_CACHE_PREFIX = "silkendrift_reviews_";

/**
 * Fetch all published reviews for a specific product from Cloud Firestore
 */
export const fetchReviewsByProductId = async (
  productId: string
): Promise<ProductReview[]> => {
  if (!productId) return [];
  const cleanId = String(productId).trim();

  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("productId", "==", cleanId));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const items = snap.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          ...data,
        } as ProductReview;
      });

      // Filter only published reviews for customers, sorted newest first
      const published = items
        .filter((r) => r.status === "published" || !r.status)
        .sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            `${REVIEWS_CACHE_PREFIX}${cleanId}`,
            JSON.stringify(published)
          );
        } catch {
          // ignore cache errors
        }
      }

      return published;
    }
  } catch (error) {
    console.warn(`Firestore reviews fetch failed for product ${cleanId}:`, error);
  }

  // Local Storage fallback for offline reliability
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(`${REVIEWS_CACHE_PREFIX}${cleanId}`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
  }

  return [];
};

/**
 * Real-time listener for reviews on a specific product
 */
export const subscribeToProductReviews = (
  productId: string,
  callback: (reviews: ProductReview[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (typeof window === "undefined" || !productId) {
    return () => {};
  }

  const cleanId = String(productId).trim();

  try {
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("productId", "==", cleanId));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((docSnap) => {
            const data = docSnap.data() as DocumentData;
            return {
              id: docSnap.id,
              ...data,
            } as ProductReview;
          });

          const published = items
            .filter((r) => r.status === "published" || !r.status)
            .sort(
              (a, b) =>
                new Date(b.createdAt || 0).getTime() -
                new Date(a.createdAt || 0).getTime()
            );

          callback(published);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn("Realtime product reviews subscription error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not set up realtime reviews subscription:", err);
    return () => {};
  }
};

/**
 * Recalculate average rating & reviewCount for a product and save to Firestore
 */
export const recalculateProductRating = async (productId: string): Promise<void> => {
  if (!productId) return;
  const cleanId = String(productId).trim();

  try {
    const q = query(collection(db, "reviews"), where("productId", "==", cleanId));
    const snap = await getDocs(q);

    const published = snap.docs
      .map((d) => d.data() as ProductReview)
      .filter((r) => r.status === "published" || !r.status);

    if (published.length > 0) {
      const sum = published.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
      const avg = Math.round((sum / published.length) * 10) / 10;

      const prodRef = doc(db, "products", cleanId);
      await updateDoc(prodRef, {
        rating: avg,
        reviewCount: published.length,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    console.warn(`Could not recalculate rating for product ${cleanId}:`, err);
  }
};

/**
 * Convert a Data URL to a lightweight Blob for storage upload
 */
const dataURLToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * High-speed image compression using native createImageBitmap & Canvas.
 * Processes camera/high-res photos in ~20-50ms without blocking main thread.
 */
export const compressImageFile = async (
  file: File,
  maxWidth = 800,
  quality = 0.7
): Promise<string> => {
  if (typeof window === "undefined") return "";

  // 1. Try hardware-accelerated createImageBitmap (fastest, ~10ms)
  if (typeof createImageBitmap !== "undefined") {
    try {
      const bitmap = await createImageBitmap(file);
      let { width, height } = bitmap;
      if (width > maxWidth || height > maxWidth) {
        if (width >= height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(bitmap, 0, 0, width, height);
        bitmap.close();
        return canvas.toDataURL("image/jpeg", quality);
      }
    } catch {
      // Fall through to object URL fallback below
    }
  }

  // 2. High-speed fallback using URL.createObjectURL (much faster than FileReader)
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;
      if (width > maxWidth || height > maxWidth) {
        if (width >= height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxWidth) / height);
          height = maxWidth;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } else {
        resolve("");
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not load image"));
    };
    img.src = objectUrl;
  });
};

/**
 * Ultra-fast review photo processor:
 * 1. Instantly compresses image locally to ~25-40KB web JPEG in < 50ms.
 * 2. If Firebase Storage is configured, attempts fast upload with a strict 2-second timeout.
 * 3. If storage upload times out or is offline, instantly returns the compressed image without waiting!
 */
export const uploadReviewImage = async (
  file: File,
  productId: string
): Promise<string> => {
  // Step 1: Compress instantly on-device (< 50ms)
  const compressedDataUrl = await compressImageFile(file, 800, 0.7);

  // If Firebase Storage is not available, return immediately!
  if (!storage || !storage.app?.options?.storageBucket) {
    return compressedDataUrl;
  }

  // Step 2: Attempt Firebase Storage upload with a strict 2.5-second race limit
  try {
    const uploadPromise = (async () => {
      const blob = dataURLToBlob(compressedDataUrl);
      const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").replace(/\.[^/.]+$/, ".jpg");
      const path = `reviews/${productId}/${Date.now()}_${cleanName}`;
      const fileRef = storageRef(storage, path);
      const snapshot = await uploadBytes(fileRef, blob, {
        contentType: "image/jpeg",
      });
      return await getDownloadURL(snapshot.ref);
    })();

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Storage timeout")), 2500)
    );

    return await Promise.race([uploadPromise, timeoutPromise]);
  } catch {
    // If storage is slow, CORS blocked, or times out, immediately use the compressed data URI!
    return compressedDataUrl;
  }
};

/**
 * Customer: Submit a new product review to Firestore
 */
export const createProductReview = async (
  reviewData: Omit<ProductReview, "id" | "createdAt">
): Promise<ProductReview> => {
  const cleanProductId = String(reviewData.productId).trim();
  const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newReview: ProductReview = {
    ...reviewData,
    id,
    rating: Math.max(1, Math.min(5, Number(reviewData.rating) || 5)),
    images: Array.isArray(reviewData.images)
      ? reviewData.images.filter((img): img is string => typeof img === "string" && img.trim().length > 0)
      : [],
    status: reviewData.status || "published", // Published by default for customer visibility
    verifiedPurchase: Boolean(reviewData.verifiedPurchase),
    helpfulCount: 0,
    createdAt: now,
    updatedAt: now,
    adminReply: null,
  };

  try {
    const reviewRef = doc(db, "reviews", id);
    await setDoc(
      reviewRef,
      sanitizeForFirestore({
        ...newReview,
        firestoreCreatedAt: serverTimestamp(),
        firestoreUpdatedAt: serverTimestamp(),
      })
    );

    // Update aggregate product rating in the background
    await recalculateProductRating(cleanProductId);

    // Update local cache
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(`${REVIEWS_CACHE_PREFIX}${cleanProductId}`);
        const existing: ProductReview[] = raw ? JSON.parse(raw) : [];
        existing.unshift(newReview);
        localStorage.setItem(
          `${REVIEWS_CACHE_PREFIX}${cleanProductId}`,
          JSON.stringify(existing)
        );
      } catch {
        // ignore
      }
    }
  } catch (error) {
    console.error("Failed to save review to Firestore:", error);
    throw error;
  }

  return newReview;
};

/**
 * Admin: Fetch all reviews across all products
 */
export const fetchAllReviewsForAdmin = async (): Promise<ProductReview[]> => {
  try {
    const reviewsRef = collection(db, "reviews");
    const snap = await getDocs(reviewsRef);

    if (!snap.empty) {
      const items = snap.docs.map((docSnap) => {
        const data = docSnap.data() as DocumentData;
        return {
          id: docSnap.id,
          ...data,
        } as ProductReview;
      });

      return items.sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
      );
    }
  } catch (error) {
    console.warn("Firestore admin reviews fetch failed:", error);
  }

  return [];
};

/**
 * Admin: Real-time listener for all reviews
 */
export const subscribeToAllReviewsForAdmin = (
  callback: (reviews: ProductReview[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  try {
    const reviewsRef = collection(db, "reviews");
    const unsubscribe = onSnapshot(
      reviewsRef,
      (snap) => {
        if (!snap.empty) {
          const items = snap.docs.map((docSnap) => {
            const data = docSnap.data() as DocumentData;
            return {
              id: docSnap.id,
              ...data,
            } as ProductReview;
          });

          const sorted = items.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime()
          );

          callback(sorted);
        } else {
          callback([]);
        }
      },
      (error) => {
        console.warn("Realtime admin reviews subscription error:", error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn("Could not set up realtime admin reviews subscription:", err);
    return () => {};
  }
};

/**
 * Admin: Update review moderation status ("published", "pending", "hidden")
 */
export const updateReviewStatusInFirestore = async (
  reviewId: string,
  status: "published" | "pending" | "hidden",
  productId?: string
): Promise<void> => {
  if (!reviewId) return;

  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      status,
      updatedAt: new Date().toISOString(),
      firestoreUpdatedAt: serverTimestamp(),
    });

    if (productId) {
      await recalculateProductRating(productId);
    }
  } catch (error) {
    console.error("Failed to update review status:", error);
    throw error;
  }
};

/**
 * Admin: Post official reply to a customer review
 */
export const replyToReviewInFirestore = async (
  reviewId: string,
  replyText: string,
  adminName: string = "SilkenDrift Atelier"
): Promise<void> => {
  if (!reviewId || !replyText.trim()) return;

  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await updateDoc(reviewRef, {
      adminReply: {
        text: replyText.trim(),
        repliedAt: new Date().toISOString(),
        repliedBy: adminName,
      },
      updatedAt: new Date().toISOString(),
      firestoreUpdatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to post admin reply to review:", error);
    throw error;
  }
};

/**
 * Admin: Delete a review permanently
 */
export const deleteReviewFromFirestore = async (
  reviewId: string,
  productId?: string
): Promise<void> => {
  if (!reviewId) return;

  try {
    const reviewRef = doc(db, "reviews", reviewId);
    await deleteDoc(reviewRef);

    if (productId) {
      await recalculateProductRating(productId);
    }
  } catch (error) {
    console.error("Failed to delete review:", error);
    throw error;
  }
};

