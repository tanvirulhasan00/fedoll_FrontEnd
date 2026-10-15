import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface CategoryItem {
  id: number | string;
  name: string;
  description?: string;
  link?: string;
  icon?: string;
}

export interface CategoryState {
  loading: boolean;
  categoryData: CategoryItem[];
  error: string | null;
}

const defaultCategories: CategoryItem[] = [
  {
    id: "all",
    name: "All Collections",
    description: "Browse all everyday export quality apparel",
    link: "/products",
    icon: "FaShirt",
  },
  {
    id: "outerwear",
    name: "Outerwear & Coats",
    description: "Warm wool topcoats and casual jackets",
    link: "/products?category=Outerwear",
    icon: "FaShirt",
  },
  {
    id: "workwear",
    name: "Workwear & Blazers",
    description: "Comfort stretch blazers and formal wear",
    link: "/products?category=Workwear",
    icon: "FaShirt",
  },
  {
    id: "denim",
    name: "Selvedge Denim",
    description: "14oz raw selvedge denim jackets and jeans",
    link: "/products?category=Denim",
    icon: "PiPantsFill",
  },
  {
    id: "knitwear",
    name: "Knitwear & Sweaters",
    description: "Soft merino wool and fine knit sweaters",
    link: "/products?category=Knitwear",
    icon: "FaShirt",
  },
  {
    id: "essentials",
    name: "Essentials & Tees",
    description: "Heavyweight 240 GSM organic cotton t-shirts",
    link: "/products?category=Essentials",
    icon: "FaShirt",
  },
  {
    id: "shirts",
    name: "Cotton Shirts",
    description: "Oxford button-down and utility casual shirts",
    link: "/products?category=Shirts",
    icon: "FaShirt",
  },
  {
    id: "trousers",
    name: "Trousers & Chinos",
    description: "Pleated formal pants and tapered chinos",
    link: "/products?category=Trousers",
    icon: "PiPantsFill",
  },
];

const initialState: CategoryState = {
  loading: false,
  categoryData: defaultCategories,
  error: null,
};

export const getAllCategory = createAsyncThunk(
  "category/getAllCategory",
  async (
    _params: { token?: string } | string | undefined = undefined,
    { rejectWithValue }
  ) => {
    try {
      // Prepared for API integration, returns category items
      return defaultCategories;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to fetch categories");
    }
  }
);

export const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategories: (state, action: PayloadAction<CategoryItem[]>) => {
      state.categoryData = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAllCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryData = action.payload;
      })
      .addCase(getAllCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch categories";
      });
  },
});

export const { setCategories } = categorySlice.actions;
export default categorySlice.reducer;
