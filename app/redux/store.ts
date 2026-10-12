import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import cartReducer from "./features/cart/cartSlice";
import companyInfoReducer from "./features/companyInfoSlice";
import reportReducer from "./features/categorySlice";
import newsletterReducer from "./features/newsletterSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    companyInfo: companyInfoReducer,
    report: reportReducer,
    newsletter: newsletterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
