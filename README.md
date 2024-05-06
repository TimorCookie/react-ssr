---
theme: juejin
highlight: vs
---

## 前言

前一阵子由于工作需要，接触了一些 C 端 SSR 项目，虽然此前也常听社区提起 SSR 概念，但自己对 react SSR 的认知也仅仅停留在 Next.js 框架的使用上，而对于 SSR、同构、注水等概念其实都挺模糊的。故借由这次机会，对 react 的 SSR 和同构原理做了些深入学习和了解，以下内容主要是这次学习实践的相关记录。

> 本次项目的源码已上传 [github](https://github.com/TimorCookie/react-ssr)

## 项目准备

**项目初始化，启动本地 server**

- `pnpm init -y`
- `pnpm add express`
- `pnpm add nodemon -D`

```javascript
// /src/server.js
const express = require("express")
const app = express()

app.get("*", (req, res) => {
  res.end("Hello World")
})
app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${port}`)
})
```

**安装 react 相关开发和生产依赖以及打包工具**

- `pnpm add react react-dom react-router-dom`
- `pnpm add webpack webpack-cli webpack-node-externals -D`
- `pnpm add babel-loader -D`
- `pnpm add @babel/core @babel/preset-react @babel/preset-env -D`

## **服务端渲染**

> renderToString renders a React tree to an HTML string.

### 借助 [renderToString](https://react.dev/reference/react-dom/server/renderToString) 实现 react 组件渲染

服务端代码改造如下

```javascript
// path: /src/server.js
const express = require("express")
const app = express()
import React from "react"
import { renderToString } from "react-dom/server"

// react 组件
const Hello = () => {
  const handleClick = () => {
    console.log("button wa clicked!")
  }
  return (
    <div>
      <h1>Hello World</h1>
      <button onClick={handleClick}>Click Me</button>
    </div>
  )
}

// 服务端拼接渲染
app.get("*", (req, res) => {
  const content = renderToString(<Hello />)
  res.end(`
    <html>
      <head>
        <title>SSR</title>
      </head>
      <body>
      <div id="root">
        ${content}
      </div>
      </body>
    </html>
  `)
})

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:3000`)
})
```

按照我们原先的设计，当我们打开 <http://localhost:3000> 时，页面应出现 Hello World 了。但实际上，在改写完服务端代码保存后，发现控制台会出现如下报错，服务直接挂了。。

[![pkED08f.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/75d0650afa9c49b282144b1084c95a43~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1130&h=754&s=112606&e=png&b=1e1e1e)](https://imgse.com/i/pkED08f)

按照报错提示，发现是由于我们在服务端引入 React 时用了 `import` 语法，而在服务端环境（Node.js）中默认使用的是 CommonJS 规范，只能使用 `require` 语句进行导入。（import 是 ES6 中模块化写法），所以我们得用一些打包工具对 `server.js` 进行编译打包操作来处理成能够在服务端环境运行的代码

### 配置 webpack 打包

> webpack 配置比较简单，本次就不赘述了，如下代码可供参考

```javascript
// path: /config/webpack.server.js
const path = require("path")
const webpackNodeExternals = require("webpack-node-externals")

module.exports = {
  target: "node",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: path.join(__dirname, "../src/server.js"),
  output: {
    filename: "bundle_server.js",
    path: path.join(__dirname, "../dist"),
  },
  module: {
    rules: [
      {
        test: /.(js|ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
  externals: [webpackNodeExternals()],
}
```

> [webpack-node-externals](https://www.npmjs.com/package/webpack-node-externals)
>
> When bundling with Webpack for the backend - you usually don't want to bundle its `node_modules` dependencies. This library creates an _externals_ function that ignores `node_modules` when bundling in Webpack.

当配置了 `externals` 时，`bundle_server.js` 体积明显小了

### 编写启动脚本命令

> 由于服务端实际运行的是打包后的代码产物，所以我们的启动命令应在 `webpack` 打包后再运行打包后的产物`bundle_server.js`，但按照此前的启动方式我们每次改完 `server.js` 的代码都得手动打个包输出到 dist 里，之后再手动运行 node 来跑打包后的产物，费力度极高。

为了提高开发效率和体验，让我们来改造下启动命令吧，先实现两个小目标：

- 监听 server.js 文件的代码变更，并在变更后自动执行 webpack 编译打包操作
- 监听 dist 文件夹产物，并在产物变更后自动执行 `node dist/bundle_server.js`

于是此时我们的 `scripts` 多了以下两个命令

```json
// package.json
{
    ...

    "scripts": {
        // webpack:server 执行打包
        "webpack:server": "webpack --config ./config/webpack.server.js --watch",
        // webpack:start 代码执行
        "webpack:start": "nodemon --watch dist --exec node dist/bundle_server.js"
      },

    ...
}
```

我们不妨再加个 [npm-run-all](https://github.com/mysticatea/npm-run-all/tree/bf91f94ce597aa61da37d2e4208ce8c48bc86673) 来实现同时运行多个脚本

`pnpm add npm-run-all -D`

此时 `package.json` 如下所示

```json
{
  "name": "react-ssr",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "webpack:server": "webpack --config ./config/webpack.server.js --watch",
    "webpack:start": "nodemon --watch dist --exec node dist/bundle_server.js",
    "dev": "npm-run-all --parallel webpack:*"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "express": "^4.19.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "@babel/core": "^7.24.5",
    "@babel/preset-env": "^7.24.5",
    "@babel/preset-react": "^7.24.1",
    "babel-loader": "^9.1.3",
    "nodemon": "^3.1.0",
    "npm-run-all": "^4.1.5",
    "webpack": "^5.91.0",
    "webpack-cli": "^5.1.4",
    "webpack-node-externals": "^3.0.0"
  }
}
```

此时，让我们重新执行 `pnpm dev`, 可以看到控制台报错消失了，打开 3000 端口，也可以成功加载我们的 Hello World 页面了
[![pkEDjG6.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c119dfcce0d942eea6ca98dc5266005a~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=689&h=558&s=49024&e=png&b=ffffff)](https://imgse.com/i/pkEDjG6)

但当我们点击页面按钮时，控制台并未打印任何内容，点击事件在服务端渲染方案下失效了。其实，这个问题我们应该很容易想到，`renderToString` 方法只是在服务端把组件渲染成 html，而事件是要绑定到浏览器的真实 dom 上而不是 html 字符串上，所以事件在 `renderToString` 的时候被过滤掉了。

另外，上面实现的服务端渲染也仅仅演示了单个组件的渲染，在 SPA 应用里，我们需要使用 react-router 来定义路由，此时路由如何维护？组件或页面的异步数据该如何获取？双端节点如何复用才能避免组件重复渲染？

## 同构

### 原理

所谓同构就是采用一套代码，构建双端（server 和 client）逻辑
[![pkErSMD.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/5f55cd0c7711402495963ce71f87674e~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1710&h=214&s=28491&e=png&b=ffffff)](https://imgse.com/i/pkErSMD)

### 路由同构

**客户端 SPA 改造**

为了更好的展示同构基本原理，我们需要对上面创建的项目进行改造，使其更像一个 SPA 应用而非 demo

> 在 src 下新建 pages 目录，并创建 Home 和 User 两个页面组件，并创建根路由组件 App.js

[![pkEr9qH.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b319e257bf7b41de9c0884175c84b326~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1280&h=741&s=274567&e=png&b=1f1f1f)](https://imgse.com/i/pkEr9qH)

**hydrate**

由于我们的应用程序的 HTML 是由 `react-dom/server` 生成的，如果想要将来自服务器的初始 HTML 快照转换为在浏览器中运行的完全可交互应用（如按钮点击事件），就需要在客户端上进行 hydrate **。**

react 提供的 **hydrateRoot** 函数将 React 组件逻辑连接到由 React 在服务端环境中渲染的现有 HTML 中。使用 hydrateRoot 后，react 将会连接到内部有 domNode 的 HTML 上，然后接管其中的 domNode。

```javascript
// src/client.js
import React from "react"
import { BrowserRouter } from "react-router-dom"
import App from "./App"
import { hydrateRoot } from "react-dom/client"

const container = document.getElementById("root")
hydrateRoot(
  container,
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

> hydrateRoot 函数允许你在先前由 `react-dom/server` 生成的浏览器 HTML DOM 节点中展示 React 组件。详细说明可参考[官方文档](https://react.dev/reference/react-dom/client/hydrateRoot)

**打包和启动脚本配置**

- 由于我们的代码也需要运行在浏览器中，所以也需要一份客户端的打包配置，完整代码如下：

```javascript
// /config/webpack.client.js
const path = require("path")
module.exports = {
  target: "web",
  mode: process.env.NODE_ENV === "production" ? "production" : "development",
  entry: path.join(__dirname, "../src/client.js"),
  output: {
    filename: "bundle_client.js",
    path: path.join(__dirname, "../dist/public"),
  },
  module: {
    rules: [
      {
        test: /.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      },
    ],
  },
}
```

- 新增客户端打包脚本`webpack:client`命令

```json
// package.json
{
    ...

    "scripts": {
        ...
        "webpack:client": "webpack --config ./config/webpack.client.js --watch",
        ...
     },
    ...
}
```

**服务端改造**

- 引入 [StaticRouter](https://reactrouter.com/en/main/router-components/static-router)

> `<StaticRouter>` is used to render a React Router web app in node. Provide the current location via the location prop.

- 在直出的 html 中拼接打包后的客户端源码` bundle_client.js`让 react 接管页面

`server.js `完整代码如下

```javascript
// src/server.js
const express = require("express")
const app = express()
import React from "react"
import { renderToString } from "react-dom/server"

import { StaticRouter } from "react-router-dom/server"
import App from "./App"

app.use(express.static("dist/public"))
app.get("*", (req, res) => {
  const content = renderToString(
    <StaticRouter location={req.url}>
      <App />
    </StaticRouter>
  )
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
```

> ⚠️ **特别注意**：服务端的 html 模板，挂载的 root 节点不能有空隙，这是为了服务端渲染的 dom 和 prop 与客户端渲染的 dom 和 prop 保持一致，从而使得 `hydrate` 不会重复渲染组件。

**本地启动**

`pnpm run dev` 后访问 <http://localhost:3000/> 和 <http://localhost:3000/user>

页面路由和事件点击均已正常响应，页面展示如下图所示

[![pkErFII.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/d12d080b91154a778e3dec672bf4bdbc~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1280&h=440&s=161541&e=png&b=fefefe)](https://imgse.com/i/pkErFII)

[![pkErZz8.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/1ef5bf003bc74835b342e163e62bc9e2~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1280&h=431&s=154123&e=png&b=fefefe)](https://imgse.com/i/pkErZz8)

### **数据同构**

通常在查找到要渲染的组件后，需要预先得到此组件所需要的数据，将数据传递给组件后，再进行组件的渲染。数据预取同构，就是解决双端如何使用同一套数据请求方法来进行数据请求。

我们可以通过给组件定义异步数据请求静态方法来处理，在 server 端和组件内就也可以直接通过组件（function） 来进行访问。

**项目改造**

为了方便演示，我们引入 [redux](https://redux.js.org/introduction/getting-started) 作为状态管理器并使用 `@reduxjs/toolkit`对项目做些改造

- 安装相关依赖

`pnpm add redux react-redux @reduxjs/toolkit`

- 创建 store 并在 client 和 server 中引入（`redux` 和 `@reduxjs/toolkit` 相关使用较为简单，这里不再赘述）

```javascript
// src/store/index.js
import { configureStore } from "@reduxjs/toolkit"
import homeReducer from "./features/homeSlice"
import userSlice from "./features/userSlice"
const store = configureStore({
  reducer: {
    home: homeReducer,
    user: userSlice,
  },
})
export default store
```

> `configureStore` 通过单个函数调用设置一个配置完善的 Redux store，包括合并 reducer、添加 thunk 中间件以及设置 Redux DevTools 集成。与 `createStore` 相比更容易配置，因为它接受命名选项参数。
>
> `createSlice` 让你使用 [Immer 库](https://immerjs.github.io/immer/) 来编写 reducer，可以使用 "mutating" JS 语法，比如 `state.value = 123`，不需要使用拓展运算符。 内部基于你的 reducer 名称生成 action type 字符串。
>
> 强烈推荐 @reduxjs/toolkit ！！详细使用可参考 [官方文档](https://redux-toolkit.js.org/introduction/getting-started)

- 页面使用请求数据（home 页为例）

```javascript
import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchHomeData } from "../store/features/homeSlice"
function Home() {
  const [count, setCount] = useState(0)
  const dispatch = useDispatch()
  const homeData = useSelector((state) => state.home)
  function handleClick() {
    setCount(count + 1)
  }
  useEffect(() => {
    dispatch(fetchHomeData())
  }, [])
  return (
    <div>
      <h1>员工列表</h1>
      <ul>
        {homeData?.employees?.map((item) => {
          return (
            <li key={item?.id}>
              <div>{item?.name}</div>
              <div>{item?.job}</div>
            </li>
          )
        })}
      </ul>
      <button onClick={handleClick}>Click Me</button>
      <p>一共点击了 {count} 次</p>
    </div>
  )
}

export default Home
```

此时，我们的项目已经集成了 redux 状态管理器，访问页面可以看到模拟的异步数据是可以正常展示的
[![pkErQds.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b6f1204880574680af2c289a38d48a6d~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1615&h=371&s=79716&e=png&b=fbfbfb)](https://imgse.com/i/pkErQds)

**数据预取**

当我们使用带有服务器渲染的 `Redux` 时，期望在生成 HTML 之前预加载一些组件初始化数据作为客户端的初始化状态，这样客户端在渲染页面时就不必再次加载初始数据。如此一来，可以提供更快的首次加载速度，同时也有利于搜索引擎的爬虫进行抓取和索引。

实现的大致思路是在查找到要渲染的页面（组件）后，预先得到此组件所需要的数据，然后将数据传递给组件后，最后进行组件的渲染即可。根据这个思路，我们不难想到解决问题的关键在于服务端如何得知要渲染的组件初始时需要什么数据？

拿上面 Home 组件举例，Home 组件的初始数据是由 `dispatch(fetchHomeData()) `方法获取，那我们在服务端执行这个方法不就可以了嘛？客户端如何将方法交由服务端就比较简单了，通常我们可以通过给组件定义静态方法来处理，在 server 端和组件内都可以直接通过组件来进行访问。

- 组件改造，新增 `getInitialData`

```javascript
// src/home.js
import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchHomeData } from "../store/features/homeSlice"
function Home() {
  const [count, setCount] = useState(0)
  const dispatch = useDispatch()
  const homeData = useSelector((state) => state.home)
  function handleClick() {
    setCount(count + 1)
  }
  useEffect(() => {
    dispatch(fetchHomeData())
  }, [])
  return (
    <div>
      <h1>员工列表</h1>
      <ul>
        {homeData?.employees?.map((item) => {
          return (
            <li key={item?.id}>
              <div>{item?.name}</div>
              <div>{item?.job}</div>
            </li>
          )
        })}
      </ul>
      <button onClick={handleClick}>Click Me</button>
      <p>一共点击了 {count} 次</p>
    </div>
  )
}

Home.getInitialData = async (store) => {
  return store.dispatch(fetchHomeData())
}

export default Home
```

- 路由改造，导出路由配置供服务端获取

```javascript
// src/App.js
import React from "react"
import { Link, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import User from "./pages/User"

export const routesConfig = [
  {
    path: "/",
    component: Home,
  },
  {
    path: "/user",
    component: User,
  },
]
const App = () => {
  return (
    <div>
      <ul>
        <li>
          <Link to="/">首页</Link>
        </li>
        <li>
          <Link to="/user">个人中心</Link>
        </li>
      </ul>
      <Routes>
        {routesConfig.map((route) => {
          const { path, component } = route
          return (
            <Route exact path={path} Component={component} key={path}></Route>
          )
        })}
      </Routes>
    </div>
  )
}

export default App
```

- `server.js` 改造，数据预取并拼接 html

导入 `routesConfig`，获取路由配置，拿到 `component` 后判断是否存在 `getInitialData` 方法，如有则执行该函数获取组件初始数据并存入 store 中，最后再拼接 html 返回渲染

我们可以先打印看下 `component`

```javascript
// src/server.js
import App, { routesConfig } from "./App"
routesConfig?.map((route) => {
  const { component = null, path = "" } = route
  // 打印component
  console.log("component info:", component)
})
```

[![pkErDF1.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/778bb7b9db374e25b82ef3a4cc317871~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1266&h=242&s=54452&e=png&b=1e1e1e)](https://imgse.com/i/pkErDF1)

从上面打印信息可以可以看到 Home 组件和 User 组件上都有我们定义的通用获取初始数据的函数，故我们只需要在请求的 url 匹配到路由 path 时执行该函数即可获取初始化数据

`server.js` 完整代码如下

```javascript
const express = require("express")
const app = express()
import React from "react"
import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router-dom/server"
import { Provider } from "react-redux"
import store from "./store"
import App, { routesConfig } from "./App"

app.use(express.static("dist/public"))
app.get("*", (req, res) => {
  // 剔除无效请求
  if (req?.url.indexOf(".") > -1) {
    res.end("")
    return false
  }
  const promiseArray = routesConfig?.map((route) => {
    const { component = null, path = "" } = route
    if (req?.url === path && component?.getInitialData) {
      return component.getInitialData(store)
    } else {
      return null
    }
  })
  Promise.all(promiseArray).then(() => {
    const content = renderToString(
      <Provider store={store}>
        <StaticRouter location={req.url}>
          <App />
        </StaticRouter>
      </Provider>
    )
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
})
app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${3000}`)
})
```

打开浏览器看到我们的请求里也返回了完整的 html 信息。

![image.png](https://p3-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b7c4c9f5e8934b09bb65ea0efd56fa08~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1884&h=448&s=111891&e=png&b=ffffff)

而此前，我们未做数据与取时服务端返回的 html 节点是空的，如下图。

![image.png](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/c081506f639d4a8e983e0482c178776a~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1914&h=362&s=109291&e=png&b=fefefe)

至此，我们即完成了数据预取操作。路由能够正确匹配，数据预取正常，服务端可以直出组件的 html ，浏览器加载 js 代码正常，查看网页源代码能看到 html 内容。但仔细观察页面后发现，我们虽然在在服务端返回的 html 中找到了异步获取的数据和节点，但页面还是闪了一下才渲染出异步数据，看起来像是又走了遍数据请求并重新渲染逻辑。

这是因为在浏览器端，双端节点对比失败，导致组件重新渲染。上面我们实现了双端的数据预取同构，但是数据也仅仅是服务端有，浏览器端是没有这个数据，当客户端进行首次组件渲染的时候没有初始化的数据，渲染出的节点肯定和服务端直出的节点不同，导致组件重新渲染。

### 渲染同构

**数据注水**

在服务端将预取的数据注入到浏览器，使浏览器端可以访问到，客户端进行渲染前将数据传入对应的组件即可，这样就保证了`props`的一致。由于我们采用了状态管理工具 redux，于是我们的注水操作需要从 redux 开始

- 修改 store 创建

![image.png](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/4c2ab744878446868b57f12eb7cbefa8~tplv-k3u1fbpfcp-jj-mark:0:0:0:0:q75.image#?w=1192&h=342&s=80250&e=png&b=1e1e1e)

通过 `@reduxjs/toolkit`源码发现 `configureStore` 是支持 `preloadedState` 参数的, 而 preloadedState 可以用来判断是否有注水数据。服务端引入无需传入 `preloadedState`， 而客户端创建时可以先获取服务端的预取的数据

于是我们可以将 store 的创建可以修改为如下形式

```javascript
import { configureStore } from "@reduxjs/toolkit"
import homeReducer from "./features/homeSlice"
import userSlice from "./features/userSlice"

// before
// const store = configureStore({
//   reducer: {
//     home: homeReducer,
//     user: userSlice
//   },
// });
// export default store;

// after
export default function createConfigureStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      home: homeReducer,
      user: userSlice,
    },
    preloadedState,
  })
}
```

- 在服务端将预取的数据注入到浏览器

我们在服务端预取的数据想要注入到客户端，需要在直出的 html 中将数据信息一并拼接返回后，才能在客户端获取该数据。例如直接挂载到 window 上

`<script>window.__PRELOADED_STATE__=${JSON.stringify(preloadedState)}</script>`

这样在客户端即可通过`window.__PRELOADED_STATE__` 来获取服务端的注入的数据

完整代码如下：

```javascript
// src/server.js
const express = require("express")
const app = express()
import React from "react"
import { renderToString } from "react-dom/server"
import { StaticRouter } from "react-router-dom/server"
import { Provider } from "react-redux"
import createConfigureStore from "./store"
import App, { routesConfig } from "./App"

app.use(express.static("dist/public"))
app.get("*", (req, res) => {
  if (req?.url.indexOf(".") > -1) {
    res.end("")
    return false
  }
  const store = createConfigureStore()
  const promiseArray = routesConfig?.map((route) => {
    const { component = null, path = "" } = route
    if (req?.url === path && component?.getInitialData) {
      return component.getInitialData(store)
    } else {
      return null
    }
  })
  Promise.all(promiseArray).then(() => {
    // 获取已预取的数据
    const preloadedState = store.getState()
    const content = renderToString(
      <Provider store={store}>
        <StaticRouter location={req.url}>
          <App />
        </StaticRouter>
      </Provider>
    )
    res.send(`
        <html>
          <head>
            <title>SSR</title>
          </head>
          <body>
            <div id="root">${content}</div>
            <script>window.__PRELOADED_STATE__=${JSON.stringify(
              preloadedState
            )}</script>
            <script src="/bundle_client.js"></script>
          </body>
        </html>
      `)
  })
})

app.listen(3000, () => {
  console.log(`Server is running at http://localhost:${3000}`)
})
```

**数据脱水**

上一步数据已经注入到了浏览器端（`window.__PRELOADED_STATE__`），这一步要在客户端组件渲染前先拿到数据，并且传入组件或全局 store 中，使得客户端 store 数据与服务端 store 数据一致。以下是客户端完成代码供参考

```javascript
// src/client.js
import React from "react"
import { BrowserRouter } from "react-router-dom"
import { hydrateRoot } from "react-dom/client"
import { Provider } from "react-redux"
import createConfigureStore from "./store"
import App from "./App"
const store = createConfigureStore(window.__PRELOADED_STATE__)
const container = document.getElementById("root")
hydrateRoot(
  container,
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>
)
```

改造完成后，当我们再次打开浏览器刷新页面，发现我们的页面已不再闪烁抖动，路由跳转和 js 代码加载执行也都无异常，页面也如预期一样是 html 直出渲染的了，大功告成！

## 结语

虽然本次原理实践的代码实现部分比较粗糙，但核心原理和基本流程都手撸了一遍，也在实践中不断试错和思考， 所以相信未来不管是在 react ssr 相关框架诸如 next.js、Remix.js 等的学习上还是后续工作的实操上都会得心应手一些吧。另外，也借由本次实践，浅浅体验了一把 `react-router 6.x` 和 `@reduxjs/toolkit`，真香！
