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
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  deleteDoc,
  updateDoc,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "./firebase.config";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: "customer" | "admin" | string;
  phoneNumber?: string;
  deliveryAddress?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  createdAt?: string | unknown;
  lastLoginAt?: string | unknown;
}

/**
 * Sync user profile to Cloud Firestore 'users' collection with role 'customer'
 */
export const syncUserToFirestore = async (
  user: User,
  additionalData?: Partial<FirestoreUserProfile>
): Promise<FirestoreUserProfile> => {
  const defaultProfile: FirestoreUserProfile = {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName || user.email?.split("@")[0] || "Customer",
    photoURL: user.photoURL || "",
    role: additionalData?.role || "customer",
    phoneNumber: additionalData?.phoneNumber || "",
    deliveryAddress: additionalData?.deliveryAddress || {},
  };

  try {
    const userRef = doc(db, "users", user.uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) {
      const existing = snap.data() as DocumentData;
      const updatedProfile: FirestoreUserProfile = {
        uid: user.uid,
        email: user.email || existing.email || "",
        displayName:
          user.displayName || existing.displayName || defaultProfile.displayName,
        photoURL: user.photoURL || existing.photoURL || "",
        role: existing.role || additionalData?.role || "customer",
        phoneNumber: existing.phoneNumber || additionalData?.phoneNumber || "",
        deliveryAddress:
          existing.deliveryAddress || additionalData?.deliveryAddress || {},
      };

      await setDoc(
        userRef,
        {
          ...updatedProfile,
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      return updatedProfile;
    } else {
      await setDoc(
        userRef,
        {
          ...defaultProfile,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
        },
        { merge: true }
      );

      return defaultProfile;
    }
  } catch (err) {
    console.warn("Could not sync user to Firestore:", err);
    return defaultProfile;
  }
};

/**
 * Fetch a customer user profile from Firestore by UID
 */
export const getUserProfileFromFirestore = async (
  uid: string
): Promise<FirestoreUserProfile | null> => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      return {
        uid,
        email: data.email || "",
        displayName: data.displayName || "",
        photoURL: data.photoURL || "",
        role: data.role || "customer",
        phoneNumber: data.phoneNumber || "",
        deliveryAddress: data.deliveryAddress || {},
      };
    }
    return null;
  } catch (error) {
    console.warn("Failed to fetch user profile from Firestore:", error);
    return null;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfileInFirestore = async (
  uid: string,
  updates: Partial<FirestoreUserProfile>
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        ...updates,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (error) {
    console.error("Error updating user profile in Firestore:", error);
    throw error;
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

/**
 * Admin: Fetch all registered customers and users from Firestore
 */
export const fetchAllCustomersFromFirestore = async (): Promise<
  FirestoreUserProfile[]
> => {
  try {
    const colRef = collection(db, "users");
    const snap = await getDocs(colRef);
    if (!snap.empty) {
      return snap.docs.map((d) => {
        const data = d.data();
        return {
          uid: d.id,
          email: data.email || "",
          displayName: data.displayName || "Customer",
          photoURL: data.photoURL || "",
          role: data.role || "customer",
          phoneNumber: data.phoneNumber || "",
          deliveryAddress: data.deliveryAddress || {},
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
        };
      });
    }
  } catch (err) {
    console.warn("Could not fetch customers from Firestore:", err);
  }

  return [];
};

/**
 * Admin: Update customer role (e.g. promote to admin or switch to customer)
 */
export const updateCustomerRoleInFirestore = async (
  uid: string,
  role: "customer" | "admin" | string
): Promise<boolean> => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        role,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    return true;
  } catch (err) {
    console.error("Could not update customer role in Firestore:", err);
    throw err;
  }
};

/**
 * Admin: Delete customer profile document from Firestore
 */
export const deleteCustomerInFirestore = async (
  uid: string
): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, "users", uid));
    return true;
  } catch (err) {
    console.error("Could not delete customer document in Firestore:", err);
    throw err;
  }
};

