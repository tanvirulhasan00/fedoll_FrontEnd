import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";

export interface CompanyInfoData {
  id?: number | string;
  name?: string;
  email?: string;
  phoneNumber?: string;
  address?: string;
  logo?: string;
  facebookLink?: string;
  twitterLink?: string;
  linkedInLink?: string;
  instagramLink?: string;
  [key: string]: any;
}

export interface CompanyInfoResponse {
  result?: CompanyInfoData;
  message?: string;
  success?: boolean;
}

export interface CompanyInfoState {
  loading: boolean;
  data: CompanyInfoResponse | null;
  error: string | null;
}

const initialState: CompanyInfoState = {
  loading: false,
  data: {
    result: {
      id: 1,
      name: "SilkenDrift",
      email: "support@silkendrift.com",
      phoneNumber: "+1 (800) 123-4567",
      address: "123 Fashion Street, New York, NY",
      facebookLink: "https://facebook.com",
      twitterLink: "https://twitter.com",
      linkedInLink: "https://linkedin.com",
      instagramLink: "https://instagram.com",
    },
    success: true,
  },
  error: null,
};

export const getCompanyInfo = createAsyncThunk(
  "companyInfo/getCompanyInfo",
  async (
    params: { token?: string; id?: number | string } = {},
    { rejectWithValue }
  ) => {
    try {
      // Prepared for API integration, returns company information
      return {
        result: {
          id: params.id || 1,
          name: "SilkenDrift",
          email: "support@silkendrift.com",
          phoneNumber: "+1 (800) 123-4567",
          address: "123 Fashion Street, New York, NY",
        },
        success: true,
      } as CompanyInfoResponse;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to fetch company info");
    }
  }
);

export const companyInfoSlice = createSlice({
  name: "companyInfo",
  initialState,
  reducers: {
    setCompanyInfo: (state, action: PayloadAction<CompanyInfoResponse>) => {
      state.data = action.payload;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getCompanyInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCompanyInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(getCompanyInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch company info";
      });
  },
});

export const { setCompanyInfo } = companyInfoSlice.actions;
export default companyInfoSlice.reducer;
