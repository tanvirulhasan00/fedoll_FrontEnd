import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

// Your web app's Firebase configuration loaded from environment variables
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "",
};

// Validate that required Firebase configuration is present
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.warn(
    "[Firebase Config] Missing required Firebase configuration in environment variables. " +
    "Ensure VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID are configured in your .env file."
  );
}

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
