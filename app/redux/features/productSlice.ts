import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchProductsFromFirestore,
  fetchProductByIdFromFirestore,
  fetchCategoriesFromFirestore,
  seedProductsToFirestore,
  initialProductsData,
  initialProductCategories,
  type ProductItem,
  type ProductCategoryItem,
} from "~/firebase";

export interface ProductState {
  items: ProductItem[];
  currentProduct: ProductItem | null;
  categories: ProductCategoryItem[];
  selectedCategory: string;
  searchQuery: string;
  sortBy: "featured" | "price-asc" | "price-desc" | "rating" | "newest";
  priceRange: [number, number];
  onlyInStock: boolean;
  loading: boolean;
  loadingProduct: boolean;
  error: string | null;
  productError: string | null;
  syncing: boolean;
}

const initialState: ProductState = {
  items: initialProductsData,
  currentProduct: null,
  categories: initialProductCategories,
  selectedCategory: "All",
  searchQuery: "",
  sortBy: "featured",
  priceRange: [0, 10000],
  onlyInStock: false,
  loading: false,
  loadingProduct: false,
  error: null,
  productError: null,
  syncing: false,
};

/**
 * Fetch products from Firestore with optional filtering parameters
 */
export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (
    params: { category?: string; searchQuery?: string; sortBy?: string } | void,
    { rejectWithValue }
  ) => {
    try {
      const data = await fetchProductsFromFirestore(params || undefined);
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to load products");
    }
  }
);

/**
 * Fetch a single product by ID
 */
export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await fetchProductByIdFromFirestore(id);
      if (!product) {
        return rejectWithValue("Product not found");
      }
      return product;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to load product details");
    }
  }
);

/**
 * Fetch product categories from Firestore
 */
export const fetchProductCategories = createAsyncThunk(
  "products/fetchProductCategories",
  async (_params: void, { rejectWithValue }) => {
    try {
      const data = await fetchCategoriesFromFirestore();
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to load categories");
    }
  }
);

/**
 * Re-seed or sync products and categories dataset to Cloud Firestore
 */
export const seedProducts = createAsyncThunk(
  "products/seedProducts",
  async (force: boolean = false, { rejectWithValue, dispatch }) => {
    try {
      const res = await seedProductsToFirestore(force);
      await dispatch(fetchProducts());
      await dispatch(fetchProductCategories());
      return res;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to seed products data");
    }
  }
);

export const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {
    setProductCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setProductSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSortBy: (
      state,
      action: PayloadAction<"featured" | "price-asc" | "price-desc" | "rating" | "newest">
    ) => {
      state.sortBy = action.payload;
    },
    setPriceRange: (state, action: PayloadAction<[number, number]>) => {
      state.priceRange = action.payload;
    },
    setOnlyInStock: (state, action: PayloadAction<boolean>) => {
      state.onlyInStock = action.payload;
    },
    resetProductFilters: (state) => {
      state.selectedCategory = "All";
      state.searchQuery = "";
      state.sortBy = "featured";
      state.priceRange = [0, 10000];
      state.onlyInStock = false;
    },
    clearCurrentProduct: (state) => {
      state.currentProduct = null;
      state.productError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch products";
      })
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loadingProduct = true;
        state.productError = null;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.loadingProduct = false;
        state.currentProduct = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loadingProduct = false;
        state.productError = (action.payload as string) || "Product not found";
      })
      // fetchProductCategories
      .addCase(fetchProductCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // seedProducts
      .addCase(seedProducts.pending, (state) => {
        state.syncing = true;
      })
      .addCase(seedProducts.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(seedProducts.rejected, (state) => {
        state.syncing = false;
      });
  },
});

export const {
  setProductCategory,
  setProductSearchQuery,
  setSortBy,
  setPriceRange,
  setOnlyInStock,
  resetProductFilters,
  clearCurrentProduct,
} = productSlice.actions;

export default productSlice.reducer;
