import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchContactDataFromFirestore,
  seedContactDataToFirestore,
  submitContactMessageToFirestore,
  initialContactData,
  type ContactPageData,
  type ContactMessagePayload,
} from "~/firebase";

export interface ContactState {
  pageData: ContactPageData;
  loadingPage: boolean;
  pageError: string | null;
  submitting: boolean;
  submitSuccess: boolean;
  submitError: string | null;
  lastSubmittedId: string | null;
  syncing: boolean;
}

const initialState: ContactState = {
  pageData: initialContactData,
  loadingPage: false,
  pageError: null,
  submitting: false,
  submitSuccess: false,
  submitError: null,
  lastSubmittedId: null,
  syncing: false,
};

/**
 * Fetch Contact Page configuration and FAQ data from Cloud Firestore
 */
export const fetchContactPageData = createAsyncThunk(
  "contact/fetchContactPageData",
  async (_params: void, { rejectWithValue }) => {
    try {
      const data = await fetchContactDataFromFirestore();
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("fetchContactPageData failed, using cached state:", error);
      return rejectWithValue(error.message || "Failed to load contact data");
    }
  }
);

/**
 * Submit Contact Inquiry to Cloud Firestore
 */
export const submitContactMessage = createAsyncThunk(
  "contact/submitContactMessage",
  async (payload: ContactMessagePayload, { rejectWithValue }) => {
    try {
      const res = await submitContactMessageToFirestore(payload);
      return res;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to send message. Please try again.");
    }
  }
);

/**
 * Re-seed or sync Contact page dataset to Cloud Firestore
 */
export const seedContactData = createAsyncThunk(
  "contact/seedContactData",
  async (force: boolean = false, { rejectWithValue, dispatch }) => {
    try {
      const res = await seedContactDataToFirestore(force);
      await dispatch(fetchContactPageData());
      return res;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to seed contact data");
    }
  }
);

export const contactSlice = createSlice({
  name: "contact",
  initialState,
  reducers: {
    setContactPageData: (state, action: PayloadAction<ContactPageData>) => {
      state.pageData = action.payload;
      state.loadingPage = false;
      state.pageError = null;
    },
    resetContactFormState: (state) => {
      state.submitting = false;
      state.submitSuccess = false;
      state.submitError = null;
      state.lastSubmittedId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchContactPageData
      .addCase(fetchContactPageData.pending, (state) => {
        state.loadingPage = true;
        state.pageError = null;
      })
      .addCase(fetchContactPageData.fulfilled, (state, action) => {
        state.loadingPage = false;
        if (action.payload) {
          state.pageData = action.payload;
        }
      })
      .addCase(fetchContactPageData.rejected, (state, action) => {
        state.loadingPage = false;
        state.pageError =
          (action.payload as string) || "Failed to fetch contact page data";
      })
      // submitContactMessage
      .addCase(submitContactMessage.pending, (state) => {
        state.submitting = true;
        state.submitSuccess = false;
        state.submitError = null;
      })
      .addCase(submitContactMessage.fulfilled, (state, action) => {
        state.submitting = false;
        state.submitSuccess = true;
        state.submitError = null;
        state.lastSubmittedId = action.payload.id;
      })
      .addCase(submitContactMessage.rejected, (state, action) => {
        state.submitting = false;
        state.submitSuccess = false;
        state.submitError =
          (action.payload as string) || "Failed to submit message";
      })
      // seedContactData
      .addCase(seedContactData.pending, (state) => {
        state.syncing = true;
      })
      .addCase(seedContactData.fulfilled, (state) => {
        state.syncing = false;
      })
      .addCase(seedContactData.rejected, (state) => {
        state.syncing = false;
      });
  },
});

export const { setContactPageData, resetContactFormState } = contactSlice.actions;
export default contactSlice.reducer;
