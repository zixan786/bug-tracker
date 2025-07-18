import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import bugSlice from "./slices/bugSlice";
import projectSlice from "./slices/projectSlice";
import uiSlice from "./slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    bugs: bugSlice,
    projects: projectSlice,
    ui: uiSlice,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
