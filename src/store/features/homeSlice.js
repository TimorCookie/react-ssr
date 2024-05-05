import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
const initialState = {
  employees: []
}
export const fetchHomeData = createAsyncThunk('fetch_home_data', async () => {
  const data = await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        employees: [
          {
            id: 1,
            name: '张三',
            job: 'web 前端开发工程师'
          },
          {
            id: 2,
            name: '李四',
            job: 'java 后端开发工程师'
          },
          {
            id: 3,
            name: '李四',
            job: 'ios 客户端开发工程师'
          },
        ]
      })
    }, 1000)
  })
  return data
})

const homeSlice = createSlice({
  name: 'home',
  initialState,
  reducers: {

  },
  extraReducers(builder) {
    builder.addCase(fetchHomeData.fulfilled, (state, action) => {
      state.employees = action?.payload?.employees
    })
  }
})

export default homeSlice.reducer