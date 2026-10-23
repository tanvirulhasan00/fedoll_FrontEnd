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

export * from "./newsletter";

/**
 * Recursively strips undefined values from objects and arrays so Firestore
 * never rejects write operations with "Unsupported field value: undefined".
 * Preserves Date, FieldValue (e.g. serverTimestamp), and Firestore Timestamp instances.
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as unknown as T;
  }

  // Handle NaN and infinite numbers which Firestore rejects
  if (typeof data === "number" && (Number.isNaN(data) || !Number.isFinite(data))) {
    return 0 as unknown as T;
  }

  // Preserve non-objects and special Firestore types
  if (
    typeof data !== "object" ||
    data instanceof Date ||
    (data && typeof data === "object" && "_methodName" in data) ||
    (data && typeof data === "object" && "toMillis" in data)
  ) {
    return data;
  }

  if (Array.isArray(data)) {
    return data
      .filter((item) => item !== undefined)
      .map((item) => sanitizeForFirestore(item)) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = sanitizeForFirestore(value);
    }
  }
  return result as T;
}

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

