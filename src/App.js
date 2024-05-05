import React from "react"
import { Link, Routes, Route } from "react-router-dom"

import Home from "./pages/Home"
import User from "./pages/User"

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
        <Route exact path="/" element={<Home />}></Route>
        <Route exact path="/user" element={<User />}></Route>
      </Routes>
    </div>
  )
}

export default App
