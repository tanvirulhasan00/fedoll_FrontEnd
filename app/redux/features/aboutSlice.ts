import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchAboutDataFromFirestore,
  seedAboutDataToFirestore,
  initialAboutData,
  type AboutData,
} from "~/firebase";

export interface AboutState {
  data: AboutData;
  loading: boolean;
  error: string | null;
  syncing: boolean;
}

const initialState: AboutState = {
  data: initialAboutData,
  loading: false,
  error: null,
  syncing: false,
};

/**
 * Fetch About Us data from Cloud Firestore
 */
export const fetchAboutData = createAsyncThunk(
  "about/fetchAboutData",
  async (_params: void, { rejectWithValue }) => {
    try {
      const data = await fetchAboutDataFromFirestore();
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("fetchAboutData failed, using cached state:", error);
      return rejectWithValue(error.message || "Failed to load about data");
    }
  }
);

/**
 * Re-seed About Us data to Cloud Firestore
 */
export const seedAboutData = createAsyncThunk(
  "about/seedAboutData",
  async (force: boolean = false, { rejectWithValue, dispatch }) => {
    try {
      const res = await seedAboutDataToFirestore(force);
      await dispatch(fetchAboutData());
      return res;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to seed about data");
    }
  }
);

export const aboutSlice = createSlice({
  name: "about",
  initialState,
  reducers: {
    setAboutData: (state, action: PayloadAction<AboutData>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAboutData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAboutData.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.data = action.payload;
        }
      })
      .addCase(fetchAboutData.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to fetch about data";
      })
      .addCase(seedAboutData.pending, (state) => {
        state.syncing = true;
      })
      .addCase(seedAboutData.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(seedAboutData.rejected, (state) => {
        state.syncing = false;
      });
  },
});

export const { setAboutData } = aboutSlice.actions;
export default aboutSlice.reducer;
