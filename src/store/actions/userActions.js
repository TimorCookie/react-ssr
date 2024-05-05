export const FETCH_USER_DATA = 'fetch_user_data'

export const fetchUserData = async (dispatch) => {
  const data = await new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve({
        userInfo: {
          name: '王二麻子',
          age: 35,
          job: '全栈开发工程师'
        }
      })
    }, 2000)
  })
  dispatch({
    type: FETCH_USER_DATA,
    payload: data
  })
}