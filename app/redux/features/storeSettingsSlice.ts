import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchStoreSettings,
  saveStoreSettings,
  defaultStoreSettings,
  type StoreGeneralSettings,
} from "~/firebase";

const LOCAL_STORAGE_STORE_KEY = "fedoll_store_general_settings_v1";

const getInitialStoreSettings = (): StoreGeneralSettings => {
  if (typeof window === "undefined") return defaultStoreSettings;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultStoreSettings, ...parsed };
    }
  } catch {}
  return defaultStoreSettings;
};

export interface StoreSettingsState {
  settings: StoreGeneralSettings;
  loading: boolean;
  error: string | null;
}

const initialState: StoreSettingsState = {
  settings: getInitialStoreSettings(),
  loading: false,
  error: null,
};

export const loadStoreSettings = createAsyncThunk(
  "storeSettings/loadStoreSettings",
  async () => {
    return await fetchStoreSettings();
  }
);

export const persistStoreSettings = createAsyncThunk(
  "storeSettings/persistStoreSettings",
  async (newSettings: StoreGeneralSettings) => {
    return await saveStoreSettings(newSettings);
  }
);

export const storeSettingsSlice = createSlice({
  name: "storeSettings",
  initialState,
  reducers: {
    setStoreSettings: (state, action: PayloadAction<StoreGeneralSettings>) => {
      state.settings = action.payload;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(LOCAL_STORAGE_STORE_KEY, JSON.stringify(action.payload));
        } catch {}
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadStoreSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoreSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(loadStoreSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to load store settings";
      })
      .addCase(persistStoreSettings.fulfilled, (state, action) => {
        state.settings = action.payload;
      });
  },
});

export const { setStoreSettings } = storeSettingsSlice.actions;
export default storeSettingsSlice.reducer;
