import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string;
  color?: string;
  category?: string;
}

export interface CartState {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
  isCartOpen: boolean;
}

const calculateTotals = (items: CartItem[]) => {
  const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  return { totalQuantity, totalAmount: Number(totalAmount.toFixed(2)) };
};

const loadInitialCart = (): {
  items: CartItem[];
  totalQuantity: number;
  totalAmount: number;
} => {
  if (typeof window === "undefined") {
    return { items: [], totalQuantity: 0, totalAmount: 0 };
  }
  try {
    const raw = localStorage.getItem("fedoll_cart");
    if (!raw) return { items: [], totalQuantity: 0, totalAmount: 0 };
    const items = JSON.parse(raw);
    if (!Array.isArray(items)) return { items: [], totalQuantity: 0, totalAmount: 0 };
    return { items, ...calculateTotals(items) };
  } catch {
    return { items: [], totalQuantity: 0, totalAmount: 0 };
  }
};

const persistCart = (items: CartItem[]) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("fedoll_cart", JSON.stringify(items));
    } catch {
      // ignore
    }
  }
};

const initialCart = loadInitialCart();

const initialState: CartState = {
  items: initialCart.items,
  totalQuantity: initialCart.totalQuantity,
  totalAmount: initialCart.totalAmount,
  isCartOpen: false,
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existing = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          item.size === action.payload.size &&
          item.color === action.payload.color
      );
      if (existing) {
        existing.quantity += action.payload.quantity || 1;
      } else {
        state.items.push({
          ...action.payload,
          quantity: action.payload.quantity || 1,
        });
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.isCartOpen = true; // Automatically open cart drawer on add
      persistCart(state.items);
    },
    removeFromCart: (state, action: PayloadAction<string | number>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistCart(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ id: string | number; quantity: number }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i.id !== action.payload.id);
        } else {
          item.quantity = action.payload.quantity;
        }
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistCart(state.items);
    },
    clearCart: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
      persistCart([]);
    },
    openCart: (state) => {
      state.isCartOpen = true;
    },
    closeCart: (state) => {
      state.isCartOpen = false;
    },
    toggleCart: (state) => {
      state.isCartOpen = !state.isCartOpen;
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  openCart,
  closeCart,
  toggleCart,
} = cartSlice.actions;

export default cartSlice.reducer;
