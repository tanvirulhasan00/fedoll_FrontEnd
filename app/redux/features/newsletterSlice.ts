import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import {
  subscribeNewsletter,
  type NewsletterSubscriptionResult,
} from "~/firebase";

export interface NewsletterState {
  loading: boolean;
  Data: NewsletterSubscriptionResult | null;
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
    payload: { token?: string; formPayload?: FormData; email?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const email =
        payload.email ||
        (payload.formPayload?.get("email") as string) ||
        "";

      const trimmedEmail = email.trim().toLowerCase();

      if (!trimmedEmail) {
        return rejectWithValue("Email address is required.");
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return rejectWithValue("Please enter a valid email address.");
      }

      const result = await subscribeNewsletter(trimmedEmail);
      return result;
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
