import {
  collection,
  doc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface NewsletterSubscriber {
  id: string;
  email: string;
  status: "active" | "unsubscribed";
  subscribedAt: string;
  source: string;
  notes?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface NewsletterSubscriptionResult {
  success: boolean;
  alreadySubscribed: boolean;
  message: string;
  email: string;
  id?: string;
  discountCode?: string;
}

const LEGACY_SEED_EMAILS = new Set([
  "sarah.jenkins@fashiondaily.co.uk",
  "tariq.rahman@dhakamail.com",
  "elena.rostova@ateliermag.com",
  "marcus.vance@urbanthread.de",
]);

export const initialSubscribers: NewsletterSubscriber[] = [];

const LOCAL_STORAGE_KEY = "fedoll_newsletter_subscribers_v2";

export const getLocalSubscribers = (): NewsletterSubscriber[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Strip out legacy mock seed emails so they never reappear
        return parsed.filter(
          (s) =>
            s &&
            s.id &&
            !s.id.startsWith("sub-seed-") &&
            !LEGACY_SEED_EMAILS.has(s.email?.toLowerCase?.())
        );
      }
    }
  } catch {
    // Ignore JSON parse errors
  }
  return [];
};

export const saveLocalSubscribers = (list: NewsletterSubscriber[]) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn("Could not save subscribers locally:", err);
  }
};

/**
 * Subscribes an email to the Cloud Firestore 'newsletters' collection.
 * Deduplicates existing emails, reactivates unsubscribed emails, and mirrors to localStorage.
 */
export const subscribeNewsletter = async (
  email: string,
  source: string = "Storefront Footer"
): Promise<NewsletterSubscriptionResult> => {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error("Email address is required.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  const localList = getLocalSubscribers();
  const existingLocal = localList.find((s) => s.email.toLowerCase() === trimmedEmail);

  try {
    const newsletterCollection = collection(db, "newsletters");

    // Check if this email already exists in Firestore
    const existingQuery = query(
      newsletterCollection,
      where("email", "==", trimmedEmail)
    );
    const existingSnapshot = await getDocs(existingQuery);

    if (!existingSnapshot.empty) {
      const docItem = existingSnapshot.docs[0];
      const data = docItem.data() as DocumentData;

      if (data.status === "active") {
        return {
          success: true,
          alreadySubscribed: true,
          message: "You are already subscribed to our VIP newsletter!",
          email: trimmedEmail,
          discountCode: "WELCOME10",
        };
      } else {
        // Reactivate previously unsubscribed email
        await updateDoc(doc(db, "newsletters", docItem.id), {
          status: "active",
          subscribedAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
          source: source || data.source || "Storefront Footer",
        });

        const updatedLocal = localList.map((item) =>
          item.email.toLowerCase() === trimmedEmail
            ? { ...item, status: "active" as const, subscribedAt: new Date().toISOString() }
            : item
        );
        saveLocalSubscribers(updatedLocal);

        return {
          success: true,
          alreadySubscribed: false,
          message: "Welcome back! Your VIP newsletter subscription has been reactivated.",
          email: trimmedEmail,
          id: docItem.id,
          discountCode: "WELCOME10",
        };
      }
    }

    // Add new subscription document in Firestore
    const newDoc = {
      email: trimmedEmail,
      status: "active" as const,
      source: source || "Storefront Footer",
      subscribedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(newsletterCollection, newDoc);

    const newSubscriber: NewsletterSubscriber = {
      id: docRef.id,
      email: trimmedEmail,
      status: "active",
      source: source || "Storefront Footer",
      subscribedAt: newDoc.subscribedAt,
    };

    const updatedLocal = [newSubscriber, ...localList.filter((s) => s.email.toLowerCase() !== trimmedEmail)];
    saveLocalSubscribers(updatedLocal);

    return {
      success: true,
      alreadySubscribed: false,
      message: "Thank you for subscribing to our newsletter! Use code WELCOME10 for 10% off.",
      email: trimmedEmail,
      id: docRef.id,
      discountCode: "WELCOME10",
    };
  } catch (err: unknown) {
    console.warn("Firestore subscription failed or offline, falling back to resilient local storage:", err);

    // Resilient local storage handling
    if (existingLocal && existingLocal.status === "active") {
      return {
        success: true,
        alreadySubscribed: true,
        message: "You are already subscribed to our VIP newsletter!",
        email: trimmedEmail,
        discountCode: "WELCOME10",
      };
    }

    const fallbackSubscriber: NewsletterSubscriber = {
      id: existingLocal?.id || `local-sub-${Date.now()}`,
      email: trimmedEmail,
      status: "active",
      source: source || "Storefront Footer",
      subscribedAt: new Date().toISOString(),
    };

    const updated = [fallbackSubscriber, ...localList.filter((s) => s.email.toLowerCase() !== trimmedEmail)];
    saveLocalSubscribers(updated);

    return {
      success: true,
      alreadySubscribed: false,
      message: "Thank you for subscribing to our newsletter! Use code WELCOME10 for 10% off.",
      email: trimmedEmail,
      id: fallbackSubscriber.id,
      discountCode: "WELCOME10",
    };
  }
};

/**
 * Admin: Fetch all newsletter subscribers from Cloud Firestore (with local fallback/sync)
 */
export const fetchAllNewsletterSubscribers = async (): Promise<NewsletterSubscriber[]> => {
  const localList = getLocalSubscribers();
  let firestoreList: NewsletterSubscriber[] = [];

  try {
    const colRef = collection(db, "newsletters");
    let snap;
    try {
      const q = query(colRef, orderBy("createdAt", "desc"));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(colRef);
    }

    if (!snap.empty) {
      firestoreList = snap.docs.map((d) => {
        const data = d.data() as DocumentData;
        return {
          id: d.id,
          email: data.email || "",
          status: (data.status as "active" | "unsubscribed") || "active",
          subscribedAt: data.subscribedAt || new Date().toISOString(),
          source: data.source || "Storefront Footer",
          notes: data.notes || "",
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch subscribers from Firestore, using local cache:", err);
  }

  // Merge Firestore records with local cache so newly added local ones aren't missed
  const mergedMap = new Map<string, NewsletterSubscriber>();

  // Add initial/local first
  localList.forEach((sub) => {
    if (sub.email) {
      mergedMap.set(sub.email.toLowerCase(), sub);
    }
  });

  // Firestore takes precedence for identical emails
  firestoreList.forEach((sub) => {
    if (sub.email) {
      mergedMap.set(sub.email.toLowerCase(), sub);
    }
  });

  const merged = Array.from(mergedMap.values());

  // Sort by subscription date descending
  merged.sort((a, b) => {
    const timeA = new Date(a.subscribedAt).getTime() || 0;
    const timeB = new Date(b.subscribedAt).getTime() || 0;
    return timeB - timeA;
  });

  saveLocalSubscribers(merged);
  return merged;
};

/**
 * Admin: Add a new newsletter subscriber manually
 */
export const addNewsletterSubscriber = async (
  email: string,
  source: string = "Admin Manual",
  notes?: string
): Promise<NewsletterSubscriber> => {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error("Email address is required.");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  let docId = `sub-${Date.now()}`;
  const now = new Date().toISOString();

  try {
    const colRef = collection(db, "newsletters");
    const docRef = await addDoc(colRef, {
      email: trimmedEmail,
      status: "active",
      source,
      notes: notes || "",
      subscribedAt: now,
      createdAt: serverTimestamp(),
    });
    docId = docRef.id;
  } catch (err) {
    console.warn("Could not save subscriber to Firestore, saving locally:", err);
  }

  const newSub: NewsletterSubscriber = {
    id: docId,
    email: trimmedEmail,
    status: "active",
    source,
    notes: notes || "",
    subscribedAt: now,
  };

  const existing = getLocalSubscribers();
  const updated = [newSub, ...existing.filter((s) => s.email.toLowerCase() !== trimmedEmail)];
  saveLocalSubscribers(updated);

  return newSub;
};

/**
 * Admin: Update subscriber status ("active" | "unsubscribed") or notes
 */
export const updateNewsletterSubscriberStatus = async (
  id: string,
  status: "active" | "unsubscribed",
  notes?: string
): Promise<boolean> => {
  try {
    if (!id.startsWith("local-") && !id.startsWith("sub-seed-")) {
      const docRef = doc(db, "newsletters", id);
      const updatePayload: Record<string, unknown> = {
        status,
        updatedAt: serverTimestamp(),
      };
      if (notes !== undefined) {
        updatePayload.notes = notes;
      }
      await updateDoc(docRef, updatePayload);
    }
  } catch (err) {
    console.warn("Could not update subscriber status in Firestore:", err);
  }

  const local = getLocalSubscribers();
  const updated = local.map((item) =>
    item.id === id
      ? {
          ...item,
          status,
          ...(notes !== undefined ? { notes } : {}),
        }
      : item
  );
  saveLocalSubscribers(updated);

  return true;
};

/**
 * Admin: Delete a subscriber by ID
 */
export const deleteNewsletterSubscriber = async (id: string): Promise<boolean> => {
  try {
    if (!id.startsWith("local-") && !id.startsWith("sub-seed-")) {
      const docRef = doc(db, "newsletters", id);
      await deleteDoc(docRef);
    }
  } catch (err) {
    console.warn("Could not delete subscriber from Firestore:", err);
  }

  const local = getLocalSubscribers();
  const updated = local.filter((item) => item.id !== id);
  saveLocalSubscribers(updated);

  return true;
};

/**
 * Admin: Bulk delete subscribers
 */
export const bulkDeleteNewsletterSubscribers = async (ids: string[]): Promise<boolean> => {
  const idsSet = new Set(ids);
  try {
    await Promise.all(
      ids
        .filter((id) => !id.startsWith("local-") && !id.startsWith("sub-seed-"))
        .map((id) => deleteDoc(doc(db, "newsletters", id)))
    );
  } catch (err) {
    console.warn("Bulk delete Firestore error:", err);
  }

  const local = getLocalSubscribers();
  const updated = local.filter((item) => !idsSet.has(item.id));
  saveLocalSubscribers(updated);

  return true;
};
