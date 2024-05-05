
import { configureStore } from "@reduxjs/toolkit";
import homeReducer from "./features/homeSlice";
import userSlice from "./features/userSlice";


// const store = configureStore({

//   reducer: {
//     home: homeReducer,
//     user: userSlice
//   },
// });
// export default store;


export default function createConfigureStore(preloadedState = {}) {
  return configureStore({
    // 合并多个Slice
    reducer: {
      home: homeReducer,
      user: userSlice
    },
    preloadedState
  })
}



