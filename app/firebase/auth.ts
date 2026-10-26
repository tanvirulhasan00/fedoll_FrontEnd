import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  type User,
  type NextOrObserver,
} from "firebase/auth";
import { initializeApp, getApps } from "firebase/app";
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
import { auth, db, firebaseConfig } from "./firebase.config";

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});

import { type AppRole } from "./roles";

export interface FirestoreUserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: AppRole | string;
  phoneNumber?: string;
  deliveryAddress?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  assignedPassword?: string;
  temporaryPassword?: string;
  passwordUpdatedAt?: string | unknown;
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
export const signInWithGoogle = async (rememberMe: boolean = true) => {
  if (typeof window !== "undefined") {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
    } catch (pErr) {
      console.warn("Could not set Google auth persistence:", pErr);
    }
  }
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
 * Login user with Email and Password with optional Remember Me persistence
 */
export const loginWithEmail = async (
  email: string,
  password: string,
  rememberMe: boolean = true
) => {
  if (typeof window !== "undefined") {
    try {
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
    } catch (pErr) {
      console.warn("Could not set email auth persistence:", pErr);
    }
  }
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
          assignedPassword: data.assignedPassword || data.temporaryPassword || "",
          temporaryPassword: data.temporaryPassword || data.assignedPassword || "",
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
 * Admin: Update customer or staff role (e.g. promote to manager, salesman, admin, or demote to customer)
 */
export const updateCustomerRoleInFirestore = async (
  uid: string,
  role: AppRole | string
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

/**
 * Delete any user record in Firestore (alias)
 */
export const deleteUserInFirestore = deleteCustomerInFirestore;

/**
 * Update user account info in Firestore (alias)
 */
export const updateUserAccountInFirestore = updateUserProfileInFirestore;

/**
 * Change currently authenticated user's password in live Firebase Auth
 */
export const changeCurrentUserPassword = async (
  newPassword: string
): Promise<boolean> => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user is currently signed in.");
  }
  await updatePassword(auth.currentUser, newPassword);
  // Also log timestamp in firestore
  try {
    await updateUserProfileInFirestore(auth.currentUser.uid, {
      updatedAt: serverTimestamp(),
    } as any);
  } catch (err) {
    console.warn("Could not record password timestamp in Firestore:", err);
  }
  return true;
};

/**
 * Admin: Assign a new temporary password and/or send an official Firebase password reset email to a target user
 */
export const adminSetUserPasswordOrReset = async (
  targetUid: string,
  targetEmail: string,
  newPassword?: string,
  sendEmail: boolean = false
): Promise<{ emailSent: boolean; passwordSaved: boolean }> => {
  let emailSent = false;
  let passwordSaved = false;

  const updates: Record<string, unknown> = {
    passwordUpdatedAt: serverTimestamp(),
  };

  if (newPassword && newPassword.trim().length >= 6) {
    updates.temporaryPassword = newPassword.trim();
    updates.assignedPassword = newPassword.trim();
    passwordSaved = true;
  }

  const userRef = doc(db, "users", targetUid);
  await setDoc(userRef, updates, { merge: true });

  if (sendEmail && targetEmail) {
    await sendPasswordResetEmail(auth, targetEmail);
    emailSent = true;
  }

  return { emailSent, passwordSaved };
};

/**
 * Admin: Create a new staff account (manager or salesman, or admin)
 * Uses a secondary Firebase App instance so the current admin is NOT logged out!
 */
export const adminCreateStaffAccount = async (params: {
  email: string;
  password: string;
  displayName: string;
  role: "manager" | "salesman" | "admin";
  phoneNumber?: string;
  deliveryAddress?: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
}): Promise<FirestoreUserProfile> => {
  const { email, password, displayName, role, phoneNumber, deliveryAddress } =
    params;

  // Initialize or get secondary auth instance to prevent switching current admin user
  const existingApp = getApps().find((a) => a.name === "SecondaryStaffAuth");
  const secondaryApp =
    existingApp || initializeApp(firebaseConfig, "SecondaryStaffAuth");
  const secondaryAuth = getAuth(secondaryApp);

  let newUid = "";
  try {
    const cred = await createUserWithEmailAndPassword(
      secondaryAuth,
      email.trim(),
      password.trim()
    );
    newUid = cred.user.uid;
    if (displayName) {
      await updateProfile(cred.user, { displayName: displayName.trim() });
    }
  } catch (err: unknown) {
    throw err;
  } finally {
    // Immediately sign out secondary auth so it doesn't keep a session
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore
    }
  }

  // Create/Save the user profile in Firestore
  const newStaffProfile: FirestoreUserProfile = {
    uid: newUid,
    email: email.trim(),
    displayName: displayName.trim(),
    photoURL: "",
    role,
    phoneNumber: phoneNumber?.trim() || "",
    deliveryAddress: deliveryAddress || {},
    assignedPassword: password.trim(),
    temporaryPassword: password.trim(),
  };

  const userRef = doc(db, "users", newUid);
  await setDoc(
    userRef,
    {
      ...newStaffProfile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true }
  );

  return newStaffProfile;
};


