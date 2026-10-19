import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store";
import { subscribeToAuthChanges, getUserProfileFromFirestore } from "~/firebase";
import { setUser } from "./features/auth/authSlice";
import { useAppDispatch } from "./hooks/hook";

function AuthSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch verified user profile including admin/customer role from Firestore
        try {
          const profile = await getUserProfileFromFirestore(firebaseUser.uid);
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: profile?.displayName || firebaseUser.displayName,
              photoURL: profile?.photoURL || firebaseUser.photoURL,
              role: profile?.role || "customer",
              phoneNumber: profile?.phoneNumber || null,
              deliveryAddress: profile?.deliveryAddress || null,
            })
          );
        } catch (err) {
          console.warn("Could not load user profile from Firestore:", err);
          dispatch(
            setUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              role: "customer",
            })
          );
        }
      } else {
        dispatch(setUser(null));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [dispatch]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthSync>{children}</AuthSync>
    </Provider>
  );
}

export default ReduxProvider;
