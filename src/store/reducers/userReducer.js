import { FETCH_USER_DATA } from "../actions/userActions"
const initialState = {
  userInfo: {}
}
export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_USER_DATA:
      return {
        ...state,
        userInfo: action?.payload?.userInfo
      }

    default:
      return state
  }
}