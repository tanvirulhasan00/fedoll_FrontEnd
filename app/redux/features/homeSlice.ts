import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchHomeDataFromFirestore,
  seedHomeDataToFirestore,
  initialHeroBanners,
  initialFeaturedCategories,
  initialProducts,
  initialTestimonials,
  initialValueProps,
  initialSpotlightBanner,
  type HeroBanner,
  type FeaturedCategory,
  type ProductItem,
  type TestimonialItem,
  type ValueProp,
  type SpotlightBanner,
  fetchUserWishlistFromFirestore,
  saveUserWishlistToFirestore,
} from "~/firebase";

export interface HomeState {
  heroBanners: HeroBanner[];
  featuredCategories: FeaturedCategory[];
  products: ProductItem[];
  testimonials: TestimonialItem[];
  valueProps: ValueProp[];
  spotlightBanner: SpotlightBanner | null;
  activeProductTab: string;
  activeHeroIndex: number;
  quickViewProduct: ProductItem | null;
  wishlistIds: string[];
  loading: boolean;
  error: string | null;
  syncing: boolean;
}

const loadInitialWishlist = (): string[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("fedoll_wishlist");
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

const HOME_PRODUCTS_CACHE_KEY = "fedoll_home_products";

const loadInitialHomeProducts = (): ProductItem[] => {
  if (typeof window === "undefined") return [];
  try {
    // 1. Try home-specific cached products first
    const rawHome = localStorage.getItem(HOME_PRODUCTS_CACHE_KEY);
    if (rawHome) {
      const parsed = JSON.parse(rawHome);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // 2. Try global products catalog cache
    const rawCatalog = localStorage.getItem("fedoll_products_v1");
    if (rawCatalog) {
      const parsed = JSON.parse(rawCatalog);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
};

const cachedHomeProducts = loadInitialHomeProducts();

const initialState: HomeState = {
  heroBanners: initialHeroBanners,
  featuredCategories: initialFeaturedCategories,
  products: cachedHomeProducts,
  testimonials: initialTestimonials,
  valueProps: initialValueProps,
  spotlightBanner: initialSpotlightBanner,
  activeProductTab: "All",
  activeHeroIndex: 0,
  quickViewProduct: null,
  wishlistIds: loadInitialWishlist(),
  loading: cachedHomeProducts.length === 0,
  error: null,
  syncing: false,
};

/**
 * Fetch all dynamic home page components from Firebase Firestore
 */
export const fetchHomeData = createAsyncThunk(
  "home/fetchHomeData",
  async (_params: void, { rejectWithValue }) => {
    try {
      const data = await fetchHomeDataFromFirestore();
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("fetchHomeData failed, falling back to cached state:", error);
      return rejectWithValue(error.message || "Failed to load home data");
    }
  }
);

/**
 * Re-seed home dataset to Firebase Firestore
 */
export const seedHomeData = createAsyncThunk(
  "home/seedHomeData",
  async (force: boolean = false, { rejectWithValue, dispatch }) => {
    try {
      const res = await seedHomeDataToFirestore(force);
      await dispatch(fetchHomeData());
      return res;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to seed home data");
    }
  }
);

export const homeSlice = createSlice({
  name: "home",
  initialState,
  reducers: {
    setActiveProductTab: (state, action: PayloadAction<string>) => {
      state.activeProductTab = action.payload;
    },
    setActiveHeroIndex: (state, action: PayloadAction<number>) => {
      state.activeHeroIndex = action.payload;
    },
    nextHeroSlide: (state) => {
      if (state.heroBanners.length > 0) {
        state.activeHeroIndex =
          (state.activeHeroIndex + 1) % state.heroBanners.length;
      }
    },
    prevHeroSlide: (state) => {
      if (state.heroBanners.length > 0) {
        state.activeHeroIndex =
          (state.activeHeroIndex - 1 + state.heroBanners.length) %
          state.heroBanners.length;
      }
    },
    setQuickViewProduct: (
      state,
      action: PayloadAction<ProductItem | null>
    ) => {
      state.quickViewProduct = action.payload;
    },
    setWishlist: (state, action: PayloadAction<string[]>) => {
      state.wishlistIds = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fedoll_wishlist", JSON.stringify(state.wishlistIds));
        } catch {
          // ignore
        }
      }
    },
    toggleWishlist: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      if (state.wishlistIds.includes(id)) {
        state.wishlistIds = state.wishlistIds.filter((item) => item !== id);
      } else {
        state.wishlistIds.push(id);
      }
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("fedoll_wishlist", JSON.stringify(state.wishlistIds));
        } catch {
          // ignore
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeData.pending, (state) => {
        if (state.products.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.heroBanners = action.payload.heroBanners;
          state.featuredCategories = action.payload.featuredCategories;
          if (Array.isArray(action.payload.products) && action.payload.products.length > 0) {
            state.products = action.payload.products;
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(HOME_PRODUCTS_CACHE_KEY, JSON.stringify(action.payload.products));
              } catch {
                // ignore
              }
            }
          }
          state.testimonials = action.payload.testimonials;
          state.valueProps = action.payload.valueProps;
          state.spotlightBanner = action.payload.spotlightBanner;
        }
      })
      .addCase(fetchHomeData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch home page data";
      })
      .addCase(seedHomeData.pending, (state) => {
        state.syncing = true;
      })
      .addCase(seedHomeData.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(seedHomeData.rejected, (state) => {
        state.syncing = false;
      });
  },
});

/**
 * Async thunk to toggle wishlist in Redux, local storage, AND Cloud Firestore DB
 */
export const toggleWishlistAsync = createAsyncThunk(
  "home/toggleWishlistAsync",
  async (
    payload: { productId: string; userId?: string },
    { getState, dispatch }
  ) => {
    const { productId, userId } = payload;
    dispatch(toggleWishlist(productId));
    if (userId) {
      const state = getState() as { home: HomeState };
      const updatedWishlist = state.home.wishlistIds;
      await saveUserWishlistToFirestore(userId, updatedWishlist);
    }
    return productId;
  }
);

/**
 * Async thunk to sync wishlist between local cache and Cloud Firestore DB on sign in
 */
export const syncWishlistWithFirestore = createAsyncThunk(
  "home/syncWishlistWithFirestore",
  async (userId: string, { getState, dispatch }) => {
    if (!userId) return [];
    try {
      const cloudWishlist = await fetchUserWishlistFromFirestore(userId);
      const state = getState() as { home: HomeState };
      const localWishlist = state.home.wishlistIds;

      // Merge cloud and local so no products are lost
      const merged = Array.from(new Set([...cloudWishlist, ...localWishlist]));
      dispatch(setWishlist(merged));

      // If local added any new items not yet in cloud, persist merged list
      if (merged.length !== cloudWishlist.length) {
        await saveUserWishlistToFirestore(userId, merged);
      }

      return merged;
    } catch (err) {
      console.warn("Failed to sync wishlist with Firestore:", err);
      return [];
    }
  }
);

export const {
  setActiveProductTab,
  setActiveHeroIndex,
  nextHeroSlide,
  prevHeroSlide,
  setQuickViewProduct,
  setWishlist,
  toggleWishlist,
} = homeSlice.actions;

export default homeSlice.reducer;

