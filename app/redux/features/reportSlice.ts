import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface CategoryItem {
  id: number | string;
  name: string;
  description?: string;
  link?: string;
  icon?: string;
}

export interface ReportState {
  loading: boolean;
  categoryData: CategoryItem[];
  error: string | null;
}

const defaultCategories: CategoryItem[] = [
  {
    id: 1,
    name: "Upper Outwear",
    description: "Get a better upper body outfit",
    link: "/upper-outwears",
    icon: "FaShirt",
  },
  {
    id: 2,
    name: "Lower Outwear",
    description: "Get a better lower body outfit",
    link: "/lower-outwears",
    icon: "PiPantsFill",
  },
];

const initialState: ReportState = {
  loading: false,
  categoryData: defaultCategories,
  error: null,
};

export const getAllReportCategory = createAsyncThunk(
  "report/getAllReportCategory",
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

export const reportSlice = createSlice({
  name: "report",
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
      .addCase(getAllReportCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllReportCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryData = action.payload;
      })
      .addCase(getAllReportCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch categories";
      });
  },
});

export const { setCategories } = reportSlice.actions;
export default reportSlice.reducer;
