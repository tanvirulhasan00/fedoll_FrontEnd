import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  fetchBlogsFromFirestore,
  fetchBlogByIdOrSlugFromFirestore,
  seedBlogsToFirestore,
  initialBlogs,
  type BlogItem,
} from "~/firebase";

export interface BlogState {
  blogs: BlogItem[];
  selectedBlog: BlogItem | null;
  loading: boolean;
  detailLoading: boolean;
  error: string | null;
  detailError: string | null;
  selectedCategory: string;
  searchQuery: string;
  seeding: boolean;
}

const initialState: BlogState = {
  blogs: initialBlogs, // Initialize with default data for instant SSR/first paint
  selectedBlog: null,
  loading: false,
  detailLoading: false,
  error: null,
  detailError: null,
  selectedCategory: "All",
  searchQuery: "",
  seeding: false,
};

/**
 * Fetch all blogs from Firestore (falls back gracefully to initialBlogs)
 */
export const fetchBlogs = createAsyncThunk(
  "blogs/fetchBlogs",
  async (_params: void, { rejectWithValue }) => {
    try {
      const data = await fetchBlogsFromFirestore();
      if (!data || data.length === 0) {
        return initialBlogs;
      }
      return data;
    } catch (err: unknown) {
      const error = err as Error;
      console.warn("fetchBlogs failed, falling back to local dataset:", error);
      return initialBlogs;
    }
  }
);

/**
 * Fetch a single blog by ID or Slug from Firestore
 */
export const fetchBlogById = createAsyncThunk(
  "blogs/fetchBlogById",
  async (idOrSlug: string, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { blogs: BlogState };
      // Check cache first in state.blogs.blogs
      const cached = state.blogs.blogs.find(
        (b) => b.id === idOrSlug || b.slug === idOrSlug
      );
      if (cached) {
        return cached;
      }

      const blog = await fetchBlogByIdOrSlugFromFirestore(idOrSlug);
      if (!blog) {
        return rejectWithValue("Blog not found");
      }
      return blog;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to load blog detail");
    }
  }
);

/**
 * Seed blogs to Firestore
 */
export const seedBlogs = createAsyncThunk(
  "blogs/seedBlogs",
  async (force: boolean = false, { rejectWithValue }) => {
    try {
      const result = await seedBlogsToFirestore(force);
      return result;
    } catch (err: unknown) {
      const error = err as Error;
      return rejectWithValue(error.message || "Failed to seed blogs");
    }
  }
);

export const blogSlice = createSlice({
  name: "blogs",
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearSelectedBlog: (state) => {
      state.selectedBlog = null;
      state.detailError = null;
    },
    setBlogs: (state, action: PayloadAction<BlogItem[]>) => {
      state.blogs = action.payload;
      state.loading = false;
      state.error = null;
    },
    toggleLikeBlog: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      const target = state.blogs.find((b) => b.id === id);
      if (target) {
        target.likes = (target.likes || 0) + 1;
      }
      if (state.selectedBlog && state.selectedBlog.id === id) {
        state.selectedBlog.likes = (state.selectedBlog.likes || 0) + 1;
      }
    },
  },
  extraReducers: (builder) => {
    // fetchBlogs
    builder
      .addCase(fetchBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
      })
      .addCase(fetchBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || "Failed to fetch blogs";
      });

    // fetchBlogById
    builder
      .addCase(fetchBlogById.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedBlog = action.payload;
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError =
          (action.payload as string) || "Failed to fetch blog detail";
      });

    // seedBlogs
    builder
      .addCase(seedBlogs.pending, (state) => {
        state.seeding = true;
      })
      .addCase(seedBlogs.fulfilled, (state) => {
        state.seeding = false;
      })
      .addCase(seedBlogs.rejected, (state) => {
        state.seeding = false;
      });
  },
});

export const {
  setSelectedCategory,
  setSearchQuery,
  clearSelectedBlog,
  setBlogs,
  toggleLikeBlog,
} = blogSlice.actions;

export default blogSlice.reducer;
