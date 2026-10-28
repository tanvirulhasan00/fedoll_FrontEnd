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
  loadingCategories: boolean;
  error: string | null;
  productError: string | null;
  syncing: boolean;
}

const loadInitialProducts = (): ProductItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("fedoll_products_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

const loadInitialCategories = (): ProductCategoryItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("fedoll_categories_v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
};

const cachedCatalog = loadInitialProducts();
const cachedCategories = loadInitialCategories();

const initialState: ProductState = {
  items: cachedCatalog,
  currentProduct: null,
  categories: cachedCategories,
  selectedCategory: "All",
  searchQuery: "",
  sortBy: "featured",
  priceRange: [0, 10000],
  onlyInStock: false,
  loading: cachedCatalog.length === 0,
  loadingProduct: false,
  loadingCategories: cachedCategories.length === 0,
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

/**
 * Synchronize products and categories from Cloud Firestore without re-seeding dummy data
 */
export const syncProductsFromFirestore = createAsyncThunk(
  "products/syncProductsFromFirestore",
  async (_params: void, { dispatch, rejectWithValue }) => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        dispatch(fetchProducts()).unwrap(),
        dispatch(fetchProductCategories()).unwrap(),
      ]);
      return { products: productsRes, categories: categoriesRes };
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to sync products from Firestore");
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
    setProductCategories: (state, action: PayloadAction<ProductCategoryItem[]>) => {
      state.categories = action.payload || [];
      state.loadingCategories = false;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fedoll_categories_v1", JSON.stringify(state.categories));
        } catch {}
      }
    },
    setProducts: (state, action: PayloadAction<ProductItem[]>) => {
      state.items = action.payload || [];
      state.loading = false;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fedoll_products_v1", JSON.stringify(state.items));
        } catch {}
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        if (state.items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("fedoll_products_v1", JSON.stringify(state.items));
          } catch {}
        }
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
      .addCase(fetchProductCategories.pending, (state) => {
        if (state.categories.length === 0) {
          state.loadingCategories = true;
        }
      })
      .addCase(fetchProductCategories.fulfilled, (state, action) => {
        state.loadingCategories = false;
        state.categories = Array.isArray(action.payload) ? action.payload : [];
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem("fedoll_categories_v1", JSON.stringify(state.categories));
          } catch {}
        }
      })
      .addCase(fetchProductCategories.rejected, (state) => {
        state.loadingCategories = false;
      })
      // syncProductsFromFirestore
      .addCase(syncProductsFromFirestore.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncProductsFromFirestore.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(syncProductsFromFirestore.rejected, (state) => {
        state.syncing = false;
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
  setProductCategories,
  setProducts,
} = productSlice.actions;

export default productSlice.reducer;
