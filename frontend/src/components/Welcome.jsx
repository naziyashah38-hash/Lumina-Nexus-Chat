// import React, { useState, useEffect, useRef } from 'react';
// import Login from './Login';
// import axios from 'axios';

// const Welcome = ({ isLogin, setIsLogin, isOpen, setIsOpen, isLoggedIn, setIsLoggedIn, user, setUser, socket, onLogout }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [activeChat, setActiveChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [typedMessage, setTypedMessage] = useState('');
//   const messagesEndRef = useRef(null);

//   useEffect(() => {
//     if (!searchQuery.trim()) {
//       setSearchResults([]);
//       return;
//     }
//     const delayDebounce = setTimeout(async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await axios.get(`http://localhost:5000/api/users/search?query=${searchQuery}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setSearchResults(res.data);
//       } catch (err) {
//         console.error(err);
//       }
//     }, 300);
//     return () => clearTimeout(delayDebounce);
//   }, [searchQuery]);

//   useEffect(() => {
//     if (!activeChat) return;
//     const fetchChatHistory = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const res = await axios.get(`http://localhost:5000/api/messages/${activeChat._id}`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setMessages(res.data);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     fetchChatHistory();
//   }, [activeChat]);

//   useEffect(() => {
//     if (!socket) return;
//     socket.on('receive-direct-message', (msg) => {
//       if (activeChat && (msg.sender === activeChat._id || msg.recipient === activeChat._id)) {
//         setMessages((prev) => [...prev, msg]);
//       }
//     });
//     return () => socket.off('receive-direct-message');
//   }, [socket, activeChat]);

//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   const handleSendMessage = () => {
//     if (!typedMessage.trim() || !socket || !activeChat) return;
//     socket.emit('send-direct-message', {
//       sender: user.id || user._id,
//       recipient: activeChat._id,
//       text: typedMessage,
//       imageUrl: ''
//     });
//     setTypedMessage('');
//   };

//   const handleConnectFriend = async (e, friendId) => {
//     e.stopPropagation();
//     try {
//       const token = localStorage.getItem('token');
//       await axios.post('http://localhost:5000/api/users/add-friend', { friendId }, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       alert('Connected successfully!');
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen max-w-6xl mx-auto border-x border-zinc-800">
//       <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
//         <h1 className="font-bold text-blue-400 tracking-wider">LUMINA</h1>
//         {isLoggedIn ? (
//           <div className="flex items-center gap-4">
//             <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">● {user?.username}</span>
//             <button onClick={onLogout} className="text-xs text-red-400 hover:underline">Logout</button>
//           </div>
//         ) : (
//           <button onClick={() => { setIsLogin(true); setIsOpen(true); }} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
//             Get Started
//           </button>
//         )}
//       </header>

//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar panels */}
//         <aside className="w-80 border-r border-zinc-800 p-4 flex flex-col gap-4 bg-zinc-900/10">
//           <input
//             type="text"
//             placeholder="Search connections..."
//             className="w-full bg-zinc-900 border border-zinc-800 p-2 rounded-lg text-sm focus:outline-none focus:border-blue-500"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />

//           <div className="flex-1 overflow-y-auto space-y-2">
//             {searchResults.map((u) => (
//               <div key={u._id} onClick={() => setActiveChat(u)} className="p-3 bg-zinc-900/50 hover:bg-zinc-800/50 rounded-xl border border-zinc-800/50 cursor-pointer flex justify-between items-center">
//                 <span className="text-sm font-medium">{u.username}</span>
//                 <button onClick={(e) => handleConnectFriend(e, u._id)} className="text-xs bg-blue-600 px-2 py-1 rounded-md">Connect</button>
//               </div>
//             ))}
//           </div>
//         </aside>

//         {/* Messaging Box Viewports */}
//         <main className="flex-1 flex flex-col bg-zinc-950">
//           {activeChat ? (
//             <>
//               <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 font-bold text-sm text-blue-400">
//                 Active Session: {activeChat.username}
//               </div>
//               <div className="flex-1 overflow-y-auto p-4 space-y-4">
//                 {messages.map((msg, i) => {
//                   const isMe = msg.sender === (user.id || user._id);
//                   return (
//                     <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
//                       <div className={`p-3 rounded-xl max-w-xs text-sm ${isMe ? 'bg-blue-600' : 'bg-zinc-800 border border-zinc-700 text-zinc-200'}`}>
//                         {msg.text}
//                       </div>
//                     </div>
//                   );
//                 })}
//                 <div ref={messagesEndRef} />
//               </div>
//               <div className="p-4 border-t border-zinc-800 bg-zinc-900/30 flex gap-3">
//                 <input
//                   type="text"
//                   placeholder="Type an instant message sequence..."
//                   className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 text-white"
//                   value={typedMessage}
//                   onChange={(e) => setTypedMessage(e.target.value)}
//                   onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
//                 />
//                 <button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700 px-5 rounded-xl text-sm font-bold">Send</button>
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
//               Select or find a contact connection card to initialize conversation data arrays.
//             </div>
//           )}
//         </main>
//       </div>

//       {isOpen && (
//         <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
//           <Login isLogin={isLogin} setIsLogin={setIsLogin} closeForm={() => setIsOpen(false)} setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
//         </div>
//       )}
//     </div>
//   );
// };

// export default Welcome;


import React, { useState, useEffect, useRef } from 'react';
import Login from './Login';
import axios from 'axios';
import { Trash } from 'lucide-react';
import { SmilePlus } from 'lucide-react';
import { Upload } from 'lucide-react';
import { Send } from 'lucide-react';
import { UserKey } from 'lucide-react';
import { LogIn } from 'lucide-react';


// Built-in collection array mimicking standard expressive visual payloads
const SYSTEM_STICKERS = [
  "🔥", "✨", "💯", "😂", "🚀", "👑", "💻", "🎉", "🎨", "👾", "❤️", "👍"
];

const Welcome = ({ isLogin, setIsLogin, isOpen, setIsOpen, isLoggedIn, setIsLoggedIn, user, setUser, socket, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef(null);



  // Synchronize local companion data arrays
  const fetchFriendsList = async () => {
  const token = localStorage.getItem('token'); 
    try {
      const currentId = user.id || user._id;
      const res = await axios.get(`http://localhost:5000/api/users/${currentId}/friends`);
      setFriends(res.data);
    } catch (err) {
      console.error("Error pulling connection sets", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn && user) {
      fetchFriendsList();
    } else {
      setFriends([]);
      setActiveChat(null);
    }
  }, [isLoggedIn, user]);

  // Handle Global Directory Matching Queries
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const searchUsers = async () => {
      try {
        const currentId = user?.id || user?._id || '';
        const res = await axios.get(`http://localhost:5000/api/users/search?query=${searchQuery}&currentUserId=${currentId}`);
        setSearchResults(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const delayDebounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Load active dialogue logs
  useEffect(() => {
    if (!activeChat || !user) return;
    const fetchChatHistory = async () => {
      try {
        const currentId = user.id || user._id;
        const res = await axios.get(`http://localhost:5000/api/messages?sender=${currentId}&recipient=${activeChat._id}`);
        setMessages(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchChatHistory();
  }, [activeChat, user]);

  // Real-time Event Subscriptions (The Cross-Window Engine Connection Fix)
  useEffect(() => {
    if (!socket) return;

    socket.on('receive-direct-message', (msg) => {
      const currentId = user?.id || user?._id;
      if (
        activeChat &&
        ((msg.sender === currentId && msg.recipient === activeChat._id) ||
         (msg.sender === activeChat._id && msg.recipient === currentId))
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    socket.on('friend-list-updated', () => {
      fetchFriendsList();
    });


    return () => {
      socket.off('receive-direct-message');
      socket.off('friend-list-updated');
    };
  }, [socket, activeChat, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (textPayload = '', fileUrl = '', isSticker = false) => {
    const currentId = user?.id || user?._id;
    if (!socket || !activeChat || !currentId) return;

    socket.emit('send-direct-message', {
      sender: currentId,
      recipient: activeChat._id,
      text: textPayload,
      fileUrl: fileUrl,
      isSticker: isSticker
    });
    setTypedMessage('');
    setShowStickers(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await axios.post('http://localhost:5000/api/messages/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      handleSendMessage('', res.data.fileUrl, false);
    } catch (err) {
      console.error("Failed uploading asset", err);
    }
  };

  // Inside Welcome component body:
const handleDeleteMessage = (id, index) => {
  setMessages((prevMessages) =>
    prevMessages.filter((msg, idx) => {
      // If the message has an ID, filter by ID
      if (id !== undefined && id !== null && id !== false) {
        return (msg._id || msg.id) !== id;
      }
      // Fallback: filter by array index
      return idx !== index;
    })
  );
};

  const handleConnectFriend = async (e, friendId) => {
    e.stopPropagation();
    const currentId = user?.id || user?._id;
    if (!currentId) return alert('Please sign in first');
    try {
      await axios.post('http://localhost:5000/api/users/add-friend', { userId: currentId, friendId });
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (time) => { 
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto ">
      <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/40">
        <h1 className=" cormorant-garamond-uniquifier font-bold text-brown-400 tracking-wider">LUMINA </h1>
        <p className=" text-bold">Lumina said  'HI' 😉</p>
        {isLoggedIn ? (
          <div className="flex items-center gap-4">
            <span className="text-xs bg-zinc-800 px-3 py-1 rounded-full border border-zinc-700">● {user?.username}</span>
            <div onClick={onLogout} className="text-xs p-2 text-red-400 hover:underline"><LogIn color="#808080" strokeWidth={2.75} alt='Log Out' /> </div>
          </div>
        ) : (
          <div onClick={() => { setIsLogin(true); setIsOpen(true);  }} className=" text-white p-3 rounded-lg font-bold font-medium transition">
            <UserKey color="#808080" strokeWidth={2.75} alt="Sign In" /> 
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Control Column */}
        <aside className="w-80 border-r border-zinc-800 p-4 flex flex-col gap-4 bg-zinc-900/10">
          <input
            type="text"
            placeholder="Find someone to spill the tea with...☕"
            className="w-full bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Directory Search Overlays */}
          {searchResults.length > 0 && (
            <div className="border-b border-zinc-800 pb-2 max-h-40 overflow-y-auto space-y-1">
              <p className="text-xs font-bold text-zinc-500 px-1 uppercase tracking-wider">This is the person who are you searching for🤔 </p>
              {searchResults.map((u) => (
                <div key={u._id} className="p-2 bg-zinc-900/80 border border-zinc-800 rounded-lg flex justify-between items-center">
                  <span className="text-xs font-medium">{u.username}</span>
                  <button onClick={(e) => handleConnectFriend(e, u._id)} className=" p-2 rounded-full text-black border font-medium">Connect</button>
                </div>
              ))}
            </div>
          )}

          {/* Established Connected Active Roster Block */}
          <div className="flex-1 overflow-y-auto space-y-1">
            <p className="text-xs font-bold text-zinc-500 px-1 uppercase tracking-wider mb-2">Who are we texting today ?👀</p>
            {friends.length === 0 ? (
              <p className="text-xs text-zinc-600 p-2 italic">Is there no one to talk ?😢</p>
            ) : (
              friends.map((f) => (
                <div 
                  key={f._id} 
                  onClick={() => setActiveChat(f)} 
                  className={`p-3 border rounded-xl flex items-center justify-between cursor-pointer transition ${activeChat?._id === f._id ? 'bg-zinc-800/80 border-blue-500' : 'bg-zinc-900/20 border-zinc-900 hover:bg-zinc-900/40'}`}
                >
                  <span className="text-sm font-medium">{f.username}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Messaging Box Viewports */}
        <main className="flex-1 flex flex-col bg-zinc-950 relative">
          {activeChat ? (
            <>
              <div className="p-4 border-b border-zinc-800 bg-zinc-900/20 font-bold text-sm ">
                 {activeChat.username}
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {messages.map((msg, i) => {
                  const isMe = msg.sender === (user?.id || user?._id);
                  return (
                    <div key={i} className={`flex flex-col  ${isMe ? 'items-end' : 'items-start'}`}>

                      <div><span className={`text-xxs ${isMe ? 'text-brown-500' : 'text-brown-500'}`}>{isMe ? 'You' : activeChat.username } {msg.createdAt && `${formatTime(msg.createdAt)}`}</span></div>

                    <div className=' flex items-center gap-2'>
                      <div className={`p-3 rounded-full text-sm ${msg.isSticker ? 'text-5xl bg-transparent !p-0 select-none' : isMe ? 'bg-brown-400 text-white' : 'bg-brown-500 border border-zinc-700 text-zinc-200'}`} style={{ marginBottom: '4px' }}>                       
                        {msg.isSticker ? msg.fileUrl : msg.text}
                        {!msg.isSticker && msg.fileUrl && (
                          <img src={msg.fileUrl} alt="uploaded content" className="mt-1 rounded-lg  h-auto border border-black/40" />
                        )}
                        
                      </div>

                       <div
                      onClick={(e) => {
                        handleDeleteMessage(msg._id || msg.id, i);
                      }}
                      className="  text-xxs cursor-pointer opacity-70 hover:opacity-100 transition-opacity "
                      title="Delete message"
                    >
                   <Trash size={10} />
                    </div>
                    </div>

                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Sticker Drawer Section */}
              {showStickers && (
                <div className="absolute bottom-20 left-4 right-4 p-3 bg-zinc-900 border border-zinc-800 rounded-2xl grid grid-cols-6 gap-3 shadow-2xl z-20">
                  {SYSTEM_STICKERS.map((sticker, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleSendMessage('', sticker, true)}
                      className="text-3xl p-2 hover:bg-zinc-800 rounded-xl transition transform hover:scale-110 active:scale-95"
                    >
                      {sticker}
                    </button>
                  ))}
                </div>
              )}

              {/* Control Action Toolbar Panel */}
              <div className="  flex items-center gap-3 w-full backdrop-blur-md py-3 ">
                <label 
                  onClick={() => setShowStickers(!showStickers)} 
                  className={`h-11 w-11 flex items-center justify-center  text-base transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-0 cursor-pointer${showStickers ? ' text-blue-400 ' : ' text-zinc-400  hover:text-zinc-200'}`}
                >
                  <SmilePlus color="#808080" strokeWidth={0.75} />
                </label>
                
                <label className="h-11 w-11 flex items-center justify-center  hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95">
                  <Upload color="#808080" strokeWidth={0.75} />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                </label>

              


                <input
                  type="text"
                  placeholder={`Message ${activeChat.username}`}
                  className="flex-1 bg-zinc-900 border border-zinc-800  rounded-full p-4 text-sm focus:outline-none focus:border-blue-500 text-white"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && typedMessage.trim() && handleSendMessage(typedMessage, '', false)}
                />
                
                <button 
                  onClick={() => typedMessage.trim() && handleSendMessage(typedMessage, '', false)} 
                  className="bg-brown-400 hover:bg-blue-700 border p-3 rounded-full text-sm font-bold transition"
                >
                  <Send color="#ffffff" strokeWidth={0.75} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-zinc-500">
              Select or search a contact connection profile to discuss who are we spilling today?🎀
            </div>
          )}
        </main>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Login isLogin={isLogin} setIsLogin={setIsLogin} closeForm={() => setIsOpen(false)} setIsLoggedIn={setIsLoggedIn} setUser={setUser} />
        </div>
      )}
    </div>
  );
};

export default Welcome;