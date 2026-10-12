import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "./firebase.config";

export interface NewsletterSubscriptionResult {
  success: boolean;
  alreadySubscribed: boolean;
  message: string;
  email: string;
  id?: string;
}

/**
 * Subscribes an email to the Cloud Firestore 'newsletters' collection.
 * Checks for existing email before creating a new record.
 */
export const subscribeNewsletter = async (
  email: string
): Promise<NewsletterSubscriptionResult> => {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    throw new Error("Email address is required.");
  }

  const newsletterCollection = collection(db, "newsletters");

  // Check if this email is already registered
  const existingQuery = query(
    newsletterCollection,
    where("email", "==", trimmedEmail)
  );
  const existingSnapshot = await getDocs(existingQuery);

  if (!existingSnapshot.empty) {
    return {
      success: true,
      alreadySubscribed: true,
      message: "You are already subscribed to our newsletter!",
      email: trimmedEmail,
    };
  }

  // Add new subscription document
  const docRef = await addDoc(newsletterCollection, {
    email: trimmedEmail,
    createdAt: serverTimestamp(),
    subscribedAt: new Date().toISOString(),
    status: "active",
  });

  return {
    success: true,
    alreadySubscribed: false,
    message: "Thank you for subscribing to our newsletter!",
    email: trimmedEmail,
    id: docRef.id,
  };
};

export {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
};

export type { DocumentData, QueryConstraint };
