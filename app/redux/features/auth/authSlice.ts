import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface UserDeliveryAddress {
  street?: string;
  city?: string;
  district?: string;
  postalCode?: string;
}

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role?: "customer" | "admin" | string;
  phoneNumber?: string | null;
  deliveryAddress?: UserDeliveryAddress | null;
  createdAt?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const loadCachedUser = (): AuthUser | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fedoll_auth_user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const initialCachedUser = loadCachedUser();

const initialState: AuthState = {
  user: initialCachedUser,
  isAuthenticated: !!initialCachedUser,
  loading: !initialCachedUser,
  error: null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<AuthUser | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
      state.loading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        try {
          if (action.payload) {
            localStorage.setItem("fedoll_auth_user", JSON.stringify(action.payload));
          } else {
            localStorage.removeItem("fedoll_auth_user");
          }
        } catch {
          // ignore storage quota error
        }
      }
    },
    updateUserProfile: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("fedoll_auth_user", JSON.stringify(state.user));
          } catch {
            // ignore storage quota error
          }
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("fedoll_auth_user");
        } catch {
          // ignore storage quota error
        }
      }
    },
  },
});

export const {
  setUser,
  updateUserProfile,
  setLoading,
  setError,
  logoutUser,
} = authSlice.actions;
export default authSlice.reducer;
