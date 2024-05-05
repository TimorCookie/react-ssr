import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { hydrateRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import store from './store'
import App from './App'

const container = document.getElementById('root');
hydrateRoot(container, <Provider store={store}><BrowserRouter><App /></BrowserRouter></Provider>);

