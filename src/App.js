import React from "react"
import { Link, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import User from "./pages/User"

export const routesConfig = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/user',
    component: User
  }
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
        {routesConfig.map(route => {
          const { path, component } = route
          return <Route exact path={path} Component={component} key={path}></Route>
        })}
      </Routes>
    </div>
  )
}



export default App
