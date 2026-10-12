import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface NewsletterState {
  loading: boolean;
  Data: unknown | null;
  error: string | null;
  success: boolean;
}

const initialState: NewsletterState = {
  loading: false,
  Data: null,
  error: null,
  success: false,
};

export const createNewsletter = createAsyncThunk(
  "newsletter/createNewsletter",
  async (
    payload: { token?: string; formPayload?: FormData } = {},
    { rejectWithValue }
  ) => {
    try {
      const email = payload.formPayload?.get("email");
      return { success: true, email: email ? String(email) : "" };
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(
        error.message || "Failed to subscribe to newsletter"
      );
    }
  }
);

export const newsletterSlice = createSlice({
  name: "newsletter",
  initialState,
  reducers: {
    resetNewsletterState: (state) => {
      state.loading = false;
      state.Data = null;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createNewsletter.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createNewsletter.fulfilled, (state, action) => {
        state.loading = false;
        state.Data = action.payload;
        state.success = true;
      })
      .addCase(createNewsletter.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to subscribe";
        state.success = false;
      });
  },
});

export const { resetNewsletterState } = newsletterSlice.actions;
export default newsletterSlice.reducer;
