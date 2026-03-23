import React, { useContext, useEffect, useRef, useState } from 'react'
import assets, { messagesDummyData } from '../assets/assets';
import { formatMessageTime } from '../lib/utils';
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const ChatContainer = () => {

  const { message, selectedUser, setSelectedUser, sendMessage, getMessage } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);
  
  const scrollRef = useRef();

  const [input, setInput] = useState("");


  // Handle Send Message : 

  const handleSendMessage = async (event) => {
    event.preventDefault();
    // console.log("Input Value: ",input);
    if(input.trim() === "") return null;
    // console.log("Sending: ",{text: input.trim()});
    await sendMessage({text: input.trim()});
    setInput("");
  }


  // Handle Send Image : 

  const handleSendImage = async (event) => {

    const file = event.target.files[0];
    if(!file || !file.type.startsWith("image/")){  // Which means if Not a File or that File type is Not a Image Type Then simply return a Error Notification.
      toast.error("Please Select Image File Only");
      return;
    }
    const reader = new FileReader();

    reader.onload = async (e) => {
      console.log("Image data:", e.target.result);
      await sendMessage({image: e.target.result}); // After Sending this image we have to clear that image on ChatBar.
      event.target.value = "";
    }
    reader.readAsDataURL(file);
  }

  // 

  useEffect(() => {
    if(selectedUser){ // If selected user available the get Messages from selected user
      getMessage(selectedUser._id);
    }
  }, [selectedUser]); // Whenever selected user change then again get messages from Newly selected user 

  useEffect(() => {
    if (scrollRef.current && message) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [message]);

  return selectedUser ? (
    <div className='h-full overflow-scroll backdrop-blur-lg relative flex flex-col'>

      {/* --------- Chat Header --------- */}

      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={ selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full' />
        <p className='flex-1 text-lg text-white flex items-center gap-2'>
          {selectedUser.fullName}   {/* If selected user is online then only the green icon display after the username */} 
          {onlineUsers.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span>}
        </p>
        <img onClick={() => setSelectedUser(null)} src={assets.arrow_icon} alt="" className='md:hidden max-w-7' />
        <img src={assets.help_icon} alt="" className='max-md:hidden max-w-5 cursor-pointer' />
      </div>

      {/* --------- Chat Messages --------- */}

      <div className='flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-3 pb-6'>

        {message.map((msg, index) => (

          <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'}`}>

            {msg.image ? (
              <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8'/>
            ) : (
              <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-all bg-violet-500/30 text-white 
                ${msg.senderId === authUser._id ? 'rounded-br-none' : 'rounded-bl-none'}`}>
                    {msg.text}
              </p>
            )}

            <div className='text-center text-xs'>
              <img src={msg.senderId === authUser._id ? authUser.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" 
              className='w-7 rounded-full'/>
              <p className='text-gray-500'>{formatMessageTime(msg.createdAt)}</p>
            </div>

          </div>

        ))}

        <div ref={scrollRef}></div>

      </div>

      {/* --------- Chat Input --------- */}

      <div className='sticky bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-black/65 px-3 rounded-full'>
          {/* <input onChange={(event) => {setInput(event.target.value)}} value={input} onKeyDown={(event) => {event.key === "Enter" ? handleSendMessage(event) : null}} type="text" className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' placeholder='Type a message...' /> */}
          <input onChange={(event) => {setInput(event.target.value)}} value={input} onKeyDown={(event) => { if(event.key === "Enter") handleSendMessage(event); }} type="text" className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-gray-400' placeholder='Type a message...' />
          <input onChange={handleSendImage} type="file" id='image' accept='image/png image/jpeg' hidden/>
          <label htmlFor="image" className='cursor-pointer'>
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 ' />
          </label>
        </div>

        <img onClick={handleSendMessage} src={assets.send_button} className='w-7 cursor-pointer' alt="" />

      </div>

    </div>
  ) : (
    <div className='flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden'>
      <img src={assets.logo_icon} alt="" className='max-w-16' />
      <p className='text-lg text-white font-medium'>Chat Anytime, Anywhere...</p>
    </div>
  )
}

export default ChatContainer;