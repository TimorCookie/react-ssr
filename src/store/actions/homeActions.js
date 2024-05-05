export const FETCH_HOME_DATA = 'fetch_home_data'

export const fetchHomeData = async (dispatch) => {
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
    }, 2000)
  })
  dispatch({
    type: FETCH_HOME_DATA,
    payload: data
  })
}