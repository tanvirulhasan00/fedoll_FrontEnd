import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/auth/authSlice";
import cartReducer from "./features/cart/cartSlice";
import companyInfoReducer from "./features/companyInfoSlice";
import categoryReducer from "./features/categorySlice";
import newsletterReducer from "./features/newsletterSlice";
import blogReducer from "./features/blogSlice";
import homeReducer from "./features/homeSlice";
import aboutReducer from "./features/aboutSlice";
import contactReducer from "./features/contactSlice";
import productReducer from "./features/productSlice";
import storeSettingsReducer from "./features/storeSettingsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    companyInfo: companyInfoReducer,
    storeSettings: storeSettingsReducer,
    category: categoryReducer,
    newsletter: newsletterReducer,
    blogs: blogReducer,
    home: homeReducer,
    about: aboutReducer,
    contact: contactReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
