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
  maxStock?: number;
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
      const maxStock = action.payload.maxStock ?? existing?.maxStock;
      const addQty = action.payload.quantity || 1;

      if (existing) {
        if (maxStock !== undefined && existing.quantity + addQty > maxStock) {
          existing.quantity = maxStock;
        } else {
          existing.quantity += addQty;
        }
        if (action.payload.maxStock !== undefined) {
          existing.maxStock = action.payload.maxStock;
        }
      } else {
        const finalQty = maxStock !== undefined ? Math.min(addQty, maxStock) : addQty;
        state.items.push({
          ...action.payload,
          quantity: finalQty,
          maxStock,
        });
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      state.isCartOpen = true; // Automatically open cart drawer on add
      persistCart(state.items);
    },
    removeFromCart: (
      state,
      action: PayloadAction<string | number | { id: string | number; size?: string; color?: string }>
    ) => {
      if (typeof action.payload === "object" && action.payload !== null) {
        const { id, size, color } = action.payload;
        state.items = state.items.filter(
          (item) =>
            !(
              item.id === id &&
              (!size || item.size === size) &&
              (!color || item.color === color)
            )
        );
      } else {
        state.items = state.items.filter((item) => item.id !== action.payload);
      }
      const totals = calculateTotals(state.items);
      state.totalQuantity = totals.totalQuantity;
      state.totalAmount = totals.totalAmount;
      persistCart(state.items);
    },
    updateQuantity: (
      state,
      action: PayloadAction<{
        id: string | number;
        quantity: number;
        size?: string;
        color?: string;
        maxStock?: number;
      }>
    ) => {
      const item = state.items.find(
        (item) =>
          item.id === action.payload.id &&
          (!action.payload.size || item.size === action.payload.size) &&
          (!action.payload.color || item.color === action.payload.color)
      );
      if (item) {
        if (action.payload.quantity <= 0) {
          state.items = state.items.filter((i) => i !== item);
        } else {
          const maxStock = action.payload.maxStock ?? item.maxStock;
          if (maxStock !== undefined && action.payload.quantity > maxStock) {
            item.quantity = maxStock;
          } else {
            item.quantity = action.payload.quantity;
          }
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
