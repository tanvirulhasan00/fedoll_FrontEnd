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

const initialState: HomeState = {
  heroBanners: initialHeroBanners,
  featuredCategories: initialFeaturedCategories,
  products: initialProducts,
  testimonials: initialTestimonials,
  valueProps: initialValueProps,
  spotlightBanner: initialSpotlightBanner,
  activeProductTab: "All",
  activeHeroIndex: 0,
  quickViewProduct: null,
  wishlistIds: loadInitialWishlist(),
  loading: false,
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
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHomeData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.heroBanners = action.payload.heroBanners;
          state.featuredCategories = action.payload.featuredCategories;
          state.products = action.payload.products;
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

export const {
  setActiveProductTab,
  setActiveHeroIndex,
  nextHeroSlide,
  prevHeroSlide,
  setQuickViewProduct,
  toggleWishlist,
} = homeSlice.actions;

export default homeSlice.reducer;
