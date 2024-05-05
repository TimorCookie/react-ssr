import { legacy_createStore, applyMiddleware } from 'redux'
import { thunk } from 'redux-thunk';

import reducer from './reducers'

const store = legacy_createStore(reducer, applyMiddleware(thunk))
export default store

// store 改造
// export default function createStoreInstance(preloadedState = {}) {
//   return legacy_createStore(reducer, preloadedState, applyMiddleware(thunk))
// }