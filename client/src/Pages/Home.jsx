import React, { useContext, useState } from 'react'
import Sidebar from '../Components/Sidebar'
import ChatContainer from '../Components/ChatContainer'
import RightSidebar from '../Components/RightSidebar'
import { ChatContext } from '../../context/ChatContext'

const Home = () => {

    const { selectedUser } = useContext(ChatContext);

  return (
    <div className='min-h-screen w-full flex justify-center items-center px-3 py-4 md:px-8 md:py-6'>
      <div className={`w-full max-w-[1000px] h-[88vh] backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden grid grid-cols-1 gap-4 md:gap-6 ${selectedUser ? 'md:grid-cols-[1fr_1.5fr_1fr] xl:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-2'}`}>
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  )
}

export default Home;