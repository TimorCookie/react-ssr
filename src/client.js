import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { hydrateRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import createConfigureStore from './store'
import App from './App'
const store = createConfigureStore(window.__PRELOADED_STATE__)

const container = document.getElementById('root');
hydrateRoot(container, (
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
));

