import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

const initialState = {
  userInfo: {}
}

export const fetchUserData = createAsyncThunk('fetch_user_data', async () => {
  const data = await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        userInfo: {
          name: '王二麻子',
          age: 35,
          job: '全栈开发工程师'
        }
      })
    }, 1000)
  })

  return data
})

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
  },
  extraReducers(builder) {
    builder.addCase(fetchUserData.fulfilled, (state, action) => {
      state.userInfo = action?.payload?.userInfo
    })
  }
})

export default userSlice.reducer
