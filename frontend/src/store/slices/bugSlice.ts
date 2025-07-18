import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { bugAPI } from "../../api/bugs";

export interface Bug {
  id: number;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed" | "reopened";
  priority: "low" | "medium" | "high" | "critical";
  severity: "minor" | "major" | "critical" | "blocker";
  type: "bug" | "feature" | "improvement" | "task";
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  environment?: string;
  browserVersion?: string;
  operatingSystem?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: string;
  updatedAt: string;
  project: {
    id: number;
    name: string;
  };
  reporter: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  assignee?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  comments?: any[];
  attachments?: any[];
}

interface BugFilters {
  status?: string;
  priority?: string;
  severity?: string;
  type?: string;
  projectId?: number;
  assigneeId?: number;
  reporterId?: number;
  search?: string;
}

interface BugState {
  bugs: Bug[];
  currentBug: Bug | null;
  isLoading: boolean;
  error: string | null;
  filters: BugFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const initialState: BugState = {
  bugs: [],
  currentBug: null,
  isLoading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

// Async thunks
export const fetchBugs = createAsyncThunk(
  "bugs/fetchBugs",
  async (params: { page?: number; limit?: number; filters?: BugFilters }, { rejectWithValue }) => {
    try {
      const response = await bugAPI.getBugs(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bugs");
    }
  }
);

export const fetchBugById = createAsyncThunk(
  "bugs/fetchBugById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await bugAPI.getBugById(id);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch bug");
    }
  }
);

export const createBug = createAsyncThunk(
  "bugs/createBug",
  async (bugData: Partial<Bug>, { rejectWithValue }) => {
    try {
      const response = await bugAPI.createBug(bugData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create bug");
    }
  }
);

export const updateBug = createAsyncThunk(
  "bugs/updateBug",
  async ({ id, data }: { id: number; data: Partial<Bug> }, { rejectWithValue }) => {
    try {
      const response = await bugAPI.updateBug(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update bug");
    }
  }
);

export const deleteBug = createAsyncThunk(
  "bugs/deleteBug",
  async (id: number, { rejectWithValue }) => {
    try {
      await bugAPI.deleteBug(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete bug");
    }
  }
);

const bugSlice = createSlice({
  name: "bugs",
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<BugFilters>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentBug: (state) => {
      state.currentBug = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch bugs
      .addCase(fetchBugs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBugs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bugs = action.payload.bugs;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchBugs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch bug by ID
      .addCase(fetchBugById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBugById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBug = action.payload.bug;
        state.error = null;
      })
      .addCase(fetchBugById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create bug
      .addCase(createBug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bugs.unshift(action.payload.bug);
        state.error = null;
      })
      .addCase(createBug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Update bug
      .addCase(updateBug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBug.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.bugs.findIndex((bug) => bug.id === action.payload.bug.id);
        if (index !== -1) {
          state.bugs[index] = action.payload.bug;
        }
        if (state.currentBug?.id === action.payload.bug.id) {
          state.currentBug = action.payload.bug;
        }
        state.error = null;
      })
      .addCase(updateBug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Delete bug
      .addCase(deleteBug.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteBug.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bugs = state.bugs.filter((bug) => bug.id !== action.payload);
        if (state.currentBug?.id === action.payload) {
          state.currentBug = null;
        }
        state.error = null;
      })
      .addCase(deleteBug.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilters, clearFilters, clearError, clearCurrentBug } = bugSlice.actions;
export default bugSlice.reducer;
