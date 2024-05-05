import React, { useEffect } from "react"
import { useDispatch, useSelector } from 'react-redux'
import { fetchUserData } from '../store/features/userSlice'
function User() {
  const dispatch = useDispatch()
  const userData = useSelector(state => state.user)

  useEffect(() => {
    dispatch(fetchUserData())
  }, []);
  return (
    <div>
      <h1>个人中心</h1>
      <div>姓名：{userData?.userInfo?.name}</div>
      <div>年龄：{userData?.userInfo?.age}</div>
    </div>
  )
}
User.getInitialData = async (store) => {
  return store.dispatch(fetchUserData())
}
export default User
