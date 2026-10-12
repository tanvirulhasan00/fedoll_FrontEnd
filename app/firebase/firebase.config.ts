import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyBB89yzBIwmNen7mqzdIWGC48f8Os55hpY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "fedolldb.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "fedolldb",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "fedolldb.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "84848394092",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:84848394092:web:27879ca442f96dfbfffd49",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-7GS1F3K007",
};

// Initialize Firebase App (prevents re-initialization during Vite HMR / SSR)
export const app: FirebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase core services
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const storage: FirebaseStorage = getStorage(app);

// Safe Analytics initialization (only in client browser environment)
let analyticsInstance: Analytics | null = null;

export const initAnalytics = async (): Promise<Analytics | null> => {
  if (typeof window !== "undefined" && !analyticsInstance) {
    try {
      const supported = await isSupported();
      if (supported) {
        analyticsInstance = getAnalytics(app);
      }
    } catch (error) {
      console.warn("Firebase Analytics initialization failed:", error);
    }
  }
  return analyticsInstance;
};

// Automatically attempt analytics init in browser
if (typeof window !== "undefined") {
  initAnalytics().catch((err) => {
    console.warn("Firebase Analytics could not be initialized:", err);
  });
}

export { analyticsInstance as analytics };
export default app;
