const express = require('express')
const app = express()
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { Provider } from 'react-redux'
import createConfigureStore from './store'
import App, { routesConfig } from './App'


app.use(express.static('dist/public'))
app.get('*', (req, res) => {
  if (req?.url.indexOf('.') > -1) { res.end(''); return false; }
  const store = createConfigureStore()
  const promiseArray = routesConfig?.map(route => {
    const { component = null, path = '' } = route

    if (req?.url === path && component?.getInitialData) {
      return component.getInitialData(store)
    } else {
      return null
    }
  })
  Promise.all(promiseArray).then(() => {
    const preloadedState = store.getState()

    const content = renderToString(
      <Provider store={store}>
        <StaticRouter location={req.url}><App /></StaticRouter>
      </Provider>
    )
    res.send(`
        <html>
          <head>
            <title>SSR</title>
          </head>
          <body>
            <div id="root">${content}</div>
            <script>window.__PRELOADED_STATE__=${JSON.stringify(preloadedState)}</script>
            <script src="/bundle_client.js"></script>
          </body>
        </html>
      `)
  })

})

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${3000}`)
})