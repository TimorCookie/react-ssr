import React, { useState, useEffect } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { fetchHomeData } from '../store/features/homeSlice'
function Home() {
  const [count, setCount] = useState(0);
  const dispatch = useDispatch()
  const homeData = useSelector(state => state.home)
  function handleClick() {
    setCount(count + 1);
  }
  useEffect(() => {
    dispatch(fetchHomeData())
  }, [])
  return (
    <div>
      <h1>员工列表</h1>
      <ul>
        {homeData?.employees?.map(item => {
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
