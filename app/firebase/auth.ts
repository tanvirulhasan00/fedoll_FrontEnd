import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  type User,
  type NextOrObserver,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase.config";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

/**
 * Sync user profile to Cloud Firestore 'users' collection
 */
export const syncUserToFirestore = async (user: User) => {
  try {
    const userRef = doc(db, "users", user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email || "",
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLoginAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Could not sync user to Firestore:", err);
  }
};

/**
 * Sign in using Google OAuth popup
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  if (result.user) {
    await syncUserToFirestore(result.user);
  }
  return result;
};

/**
 * Register a new user with Email, Password and optional Display Name
 */
export const registerWithEmail = async (
  email: string,
  password: string,
  displayName?: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && result.user) {
    await updateProfile(result.user, { displayName });
  }
  if (result.user) {
    await syncUserToFirestore(result.user);
  }
  return result;
};

/**
 * Login user with Email and Password
 */
export const loginWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  if (result.user) {
    await syncUserToFirestore(result.user);
  }
  return result;
};

/**
 * Send password reset email
 */
export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Sign out current user
 */
export const logout = () => {
  return signOut(auth);
};

/**
 * Subscribe to Firebase auth state changes
 */
export const subscribeToAuthChanges = (callback: NextOrObserver<User>) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Format common Firebase Auth error codes into human-readable messages
 */
export const formatAuthError = (error: unknown): string => {
  if (!error || typeof error !== "object") {
    return "An unknown error occurred.";
  }

  const err = error as { code?: string; message?: string };
  switch (err.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Invalid email or password. Please try again.";
    case "auth/email-already-in-use":
      return "An account with this email address already exists.";
    case "auth/weak-password":
      return "Password is too weak. Please use at least 6 characters.";
    case "auth/invalid-email":
      return "Please provide a valid email address.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed before completion.";
    case "auth/popup-blocked":
      return "Sign-in popup was blocked by your browser. Please allow popups.";
    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    default:
      return err.message || "Authentication failed. Please try again.";
  }
};

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
};
