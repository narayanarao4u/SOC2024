import { configureStore } from "@reduxjs/toolkit";
import postReducer from "../frontend/src/redux/memdataSlice";

export const store = configureStore({
  reducer: {
    posts: postReducer,
  },
});
