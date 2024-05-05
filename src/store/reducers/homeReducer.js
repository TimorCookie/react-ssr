import { FETCH_HOME_DATA } from '../actions/homeActions'

const initialState = {
  employees: []
}
export default (state = initialState, action) => {
  switch (action.type) {
    case FETCH_HOME_DATA:
      return {
        ...state,
        employees: action.payload.employees
      }

    default:
      return state
  }
}