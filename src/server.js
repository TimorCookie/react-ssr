const express = require('express')
const app = express()
import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import { Provider } from 'react-redux'
import store from './store'
import App from './App'

app.use(express.static('dist/public'))
app.get('*', (req, res) => {
  const content = renderToString(<Provider store={store}><StaticRouter location={req.url}><App /></StaticRouter></Provider>)
  res.send(`
      <html>
        <head>
          <title>SSR</title>
        </head>
        <body>
          <div id="root">${content}</div>
          <script src="/bundle_client.js"></script>
        </body>
      </html>
    `)
})

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${3000}`)
})