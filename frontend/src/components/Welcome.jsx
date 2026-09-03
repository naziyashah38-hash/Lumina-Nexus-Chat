import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Login from './Login';
import { LogIn, LogOut, Send,  UserPlus , SmilePlus , Upload ,Trash2 , Smile , X , Check } from 'lucide-react';
import { UserKey } from 'lucide-react';
import { Dot } from 'lucide-react';

const SYSTEM_STICKERS = ['😀', '😂', '😍', '😎', '🔥', '👍', '❤️', '🎉'];

export default function Welcome({
  isLogIn,
  setIsLogIn,
  isOpen,
  setIsOpen,
  isLoggedIn,
  setIsLoggedIn,
  onSearchInteraction,
  user,
  setUser,
  handleLogout,
  message_reactions,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [activeEmojiMenu, setActiveEmojiMenu] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const channelRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const targetChatId = activeChat?.id || activeChat?.friend_id || activeChat?.user_id;
  const [isToggle, setIsToggle] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  const closePending = () => {
  setIsToggle(false);
};
 const togglePending = () => {
  setIsToggle((prev) => !prev);
};

  const formatExactLastSeen = (timestamp) => {
          if (!timestamp) return 'Offline';

          const date = new Date(timestamp);
          
          // Format as "Aug 21 at 6:46 PM" (or "Today at 6:46 PM")
          const isToday = new Date().toDateString() === date.toDateString();
          const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

          if (isToday) {
            return `Today at ${timeStr}`;
          }

          const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
          return `${dateStr} at ${timeStr}`;
        };

useEffect(() => {
  if (!user?.id) return;

  const updateMyLastSeen = async () => {
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', user.id);
  };

  // 1. Update timestamp immediately when opening the app
  updateMyLastSeen();

  // 2. Update timestamp when closing the browser tab
  const handleBeforeUnload = () => {
    updateMyLastSeen();
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    // 3. Update timestamp when leaving/unmounting
    updateMyLastSeen();
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
}, [user?.id]);

  const handleSearchInput = (e) => {
    // If not logged in, trigger the pop-up immediately and prevent typing
    if (!isLoggedIn) {
      if (onSearchInteraction) onSearchInteraction();
      return;
    }

    // Normal search logic for logged in users
    setSearchQuery(e.target.value);
  }

const fetchFriends = async () => {
  if (!user) return;

  const { data: rows, error } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error || !rows || rows.length === 0) {
    setFriends([]);
    // REMOVED 'return;' here so it continues to fetch pending requests!
  } else {
    // Extract all related IDs that are NOT the current user
    const friendIds = rows.map((r) =>
      r.user_id === user.id ? r.friend_id : r.user_id
    );

    // Get matching user profiles
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    setFriends(profileData || []);
  }

  const { data: pendingRows, error: pendingError } = await supabase
    .from('friends')
    .select('id, user_id')
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  if (pendingError || !pendingRows || pendingRows.length === 0) {
    setPendingRequests([]);
  } else {
    // Extract sender IDs
    const senderIds = pendingRows.map((r) => r.user_id);

    // Get sender profiles
    const { data: senderProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', senderIds);

    // Format data to match the UI map function
    const formattedRequests = pendingRows.map((req) => ({
      id: req.id,
      profiles: senderProfiles?.find((p) => p.id === req.user_id),
    }));

    setPendingRequests(formattedRequests);
  }
};

useEffect(() => {
  if (user?.id) {
    fetchFriends();
  }
}, [user?.id]);

// Search Directory with Debugging
useEffect(() => {
  if (!searchQuery.trim()) {
    setSearchResults([]);
    return;
  }

  const searchUsers = async () => {
    console.log("Searching for:", searchQuery);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${searchQuery.trim()}%`);

    // Filter out current logged in user
    const filtered = (data || []).filter((u) => u.id !== user?.id);
    setSearchResults(filtered);
  };

  const debounce = setTimeout(searchUsers, 300);
  return () => clearTimeout(debounce);
}, [searchQuery, user]);

  // Fetch Messages for Selected Chat
  const fetchChatHistory = async () => {
    if (!activeChat || !user) return;

    const { data, error } = await supabase
      .from('messages')
      .select('*, message_reactions(*)')
      .or(
        `and(sender.eq.${user.id},recipient.eq.${activeChat.id}),and(sender.eq.${activeChat.id},recipient.eq.${user.id})`
      )
      .order('created_at', { ascending: true });

    if (!error) {
      setMessages(data || []);
    }
  };

  useEffect(() => {
    fetchChatHistory();
  }, [activeChat, user]);

  // Supabase Realtime Listener
  useEffect(() => {
setIsFriendTyping(false);
    // Extract the target chat user ID safely
  const targetChatId = activeChat?.id || activeChat?.friend_id || activeChat?.user_id;

   if (!targetChatId || !user?.id) 
    return; 
    // Symmetric room ID so both users join the exact same channel
  const roomId = [user.id, targetChatId].sort().join('_');

  const channel = supabase.channel(`chat_room:${roomId}`, {
    config: { presence: { key: user.id } },
  });
        channelRef.current = channel;

     channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender === user.id && newMsg.recipient === activeChat.id) ||
            (newMsg.sender === activeChat.id && newMsg.recipient === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg , message_reactions ]);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'message_reactions' },
        (payload) => {
          // Refresh messages when reactions update
          fetchChatHistory();
        }
      )
          // ✅ Make sure your Realtime setup is closed properly
      .on('broadcast', { event: 'typing' }, (payload) => {
        const data = payload?.payload || payload;
        const senderId = data?.userId;
        const typingStatus = data?.isTyping;

        if (senderId && String(senderId) !== String(user?.id)) {
          setIsFriendTyping(Boolean(typingStatus));
        }
})
    .on('presence', { event: 'sync' }, () => {
      setOnlineUsers(channel.presenceState());
    })
      .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        channel.track({
          user_id: user.id,
          online_at: new Date().toISOString(),
        });
      }
    });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [targetChatId , user?.id]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Input typing status broadcast
  const handleTypedMessageChange = (e) => {
    setTypedMessage(e.target.value);

   // Check if channel exists AND is subscribed
  if (!channelRef.current|| !targetChatId) 
  return;


    const roomId = [user.id, activeChat.id].sort().join('_');
   channelRef.current.send({
    type: 'broadcast',
    event: 'typing',
    payload: {
      userId: user.id,
      isTyping: e.target.value.trim().length > 0,
     },
  });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
     if (channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id, isTyping: false },
      });
    }
  }, 1500);
}; 

  // Send Direct Message
  const handleSendMessage = async (textPayload = '', fileUrl = '', isSticker = false) => {
    if (!user || !activeChat) return;

    const { error } = await supabase.from('messages').insert([
      {
        sender: user.id,
        recipient: activeChat.id,
        text: textPayload,
        file_url: fileUrl,
        is_sticker: isSticker,
      },
    ]);

    if (!error) {
      setTypedMessage('');
      setShowStickers(false);
      setIsTyping(false);
    }
  };
  // Toggle Reaction on Message
 const handleToggleReaction = async (messageId, emoji) => {
  try {
    // 1. Check if user already reacted with this emoji on this message
    const { data: existingReaction, error: fetchError } = await supabase
      .from('message_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji)
      .maybeSingle();

    if (fetchError) throw fetchError;

    if (existingReaction) {
      // 2. If it exists, remove it (Toggle OFF)
      await supabase
        .from('message_reactions')
        .delete()
        .eq('id', existingReaction.id);
    } else {
      // 3. If it doesn't exist, insert it (Toggle ON)
      await supabase
        .from('message_reactions')
        .insert([{ message_id: messageId, user_id: user.id, emoji }]);
    }

    // Hide emoji picker menu after clicking
    setActiveEmojiMenu(null);
  } catch (error) {
    console.error('Error toggling reaction:', error.message);
  }
};

 // Upload Attachment
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file || !user || !activeChat) return;

  const fileName = `${Date.now()}_${file.name}`;

  // 1. Upload to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-uploads')
    .upload(fileName, file);

  // If upload fails (e.g., bucket permissions/RLS policy issues)
  if (uploadError) {
    console.error('Supabase Storage Upload Error:', uploadError.message);
    alert(`Failed to upload file: ${uploadError.message}`);
    return;
  }

  // 2. Get Public URL
  const { data: publicUrlData } = supabase.storage
    .from('chat-uploads')
    .getPublicUrl(fileName);

  if (publicUrlData?.publicUrl) {
    // 3. Send Message with File URL
    await handleSendMessage('', publicUrlData.publicUrl, false);
  } else {
    console.error('Failed to generate public URL for file');
  }

  // Clear input value so same file can be selected again if needed
  e.target.value = '';
};

const handleDeleteMessage = async (messageId) => {

  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', messageId);

  if (error) {
    console.error("Error deleting message:", error.message);
    alert("Could not delete message: " + error.message);
    return;
  }

  setMessages((prev) => prev.filter((msg) => msg?.id !== messageId));
};

// time
const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const handleConnectFriend = async (e, target) => {
  e.stopPropagation();

  const targetId = typeof target === 'object' ? target?.id : target;

  if (!user?.id || !targetId) return;

  // 1. Check if friendship already exists in state
  const alreadyFriend = friends.some((f) => f.id === targetId);
  if (alreadyFriend) {
    if (typeof target === 'object') setActiveChat(target);
    setSearchQuery('');
    setSearchResults([]);
    return;
  }
if (!user || !user.id) {
  alert("You must be logged in to add a friend!");
  setIsOpen(true); // Open login modal
  return;
}
  // 2. Insert connection into Supabase
  const { error } = await supabase.from('friends').insert([
    { user_id: user.id, friend_id: targetId, status: 'pending' }
  ]);
  if (!error) {
    console.log("Friend request sent!");
    fetchFriends(); // Refresh the lists
  } else {
    console.error("Error sending request:", error.message);
  }

  if (error) {
    // If it's a duplicate constraint, ignore the error and select the chat anyway
    if (error.code === '23505') {
      if (typeof target === 'object') setActiveChat(target);
    } else {
      console.error("Error adding friend:", error.message);
      alert("Could not add user: " + error.message);
      return;
    }
  }

  // 3. Add to local friends state immediately
  if (typeof target === 'object') {
    setFriends((prev) => {
      if (prev.some((f) => f.id === target.id)) return prev;
      return [...prev, target];
    });
    setActiveChat(target);
  } else {
    fetchFriends();
  }

  setSearchQuery('');
  setSearchResults([]);
};

// Accept Request: Updates status to 'accepted' and refreshes lists
const handleAcceptRequest = async (requestId) => {
  const { error } = await supabase
    .from('friends')
    .update({ status: 'accepted' })
    .eq('id', requestId);

  if (!error) {
    fetchFriends(); 
  } else {
    console.error('Error accepting request:', error.message);
  }
};

// Decline Request: Deletes the pending request from the database
const handleDeclineRequest = async (requestId) => {
  const { error } = await supabase
    .from('friends')
    .delete()
    .eq('id', requestId);

  if (!error) {
    fetchFriends();
  } else {
    console.error('Error declining request:', error.message);
  }
};

  return (
    
    <div className="min-h-screen flex flex-col text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full p-8  border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h1 className=" cormorant-garamond-uniquifier font-bold text-brown-400 ml-1 text-2xl tracking-wider ">LUMINA NEXUS </h1>
         {/* <p className=" text-bold ">Lumina said  'HI' 😉</p> */}
        {isLoggedIn ? (
          <div className="flex items-center "> 
          <Dot size={36} color='#D4D7DB' strokeWidth={3} />
            <span className="text-sm bg-zinc-800 p-2 rounded-full  ">
              {user?.username || user?.email}
            </span>
             <div onClick={() => {
            setShowLogoutConfirm(true)
          }} className="text-xs p-2  hover:underline"><LogIn color="#D4D7DB" strokeWidth={2.75} alt='Log Out' />  </div>
          </div>
        ) : (
          
          <div
            onClick={() => {
             setIsLogIn(true);
              setIsOpen(true);
            }}
            className="text-white p-3 rounded-lg bold cursor-pointer btn-login.active:hover btn-login.active font-medium "
          >
           <UserKey color="#808080" strokeWidth={2.75} alt="Sign In" /> 
          </div>
        )}
      </header>

      {/* Main Container */}
      <div className="flex w-full mt-16  ">
        {/* Sidebar */}
        <aside className="fixed top-14  left-0 w-92 h-calc mt-2 border-r scrollbar-none overflow-auto  border-zinc-800 p-3 flex flex-col gap-4 bg-sidebar shrink-0 z-40 ">
          <input
            type="text"
            placeholder=" Find someone to spill the tea with...☕"
         className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl  text-sm focus:outline-none text-mauve-950 shrink-0 " 
            value={searchQuery}
            onFocus={() => {
          if (!isLoggedIn && onSearchInteraction) {
            onSearchInteraction();
          }
        }} else 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="flex  flex-col gap-3  shrink-0">
              <p className="text-xs  text-zinc-500 p-2 rounded-full  tracking-wider">This is the person who are you searching for🤔?</p>
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-600 rounded-lg"
                >
                  <span className="text-sm text-brown-400 ">
                    {u.username}
                  </span>
                  <div
                    onClick={(e) => handleConnectFriend(e, u)}
                    className="p-1 rounded cursor-pointer "
                  >
                    <UserPlus size={16} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Friends List */}
          <div className="flex-1 overflow-y-auto flex  flex-col gap-1">
            <p className="text-xs font-bold text-zinc-500 px-1 uppercase tracking-wider mb-2">Who are we texting today ?👀</p>
            {friends.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveChat(f)}
                className={`p-3 rounded-xl cursor-pointer bg-frnd  transition ${
                  activeChat?.id === f.id
                    ? 'bg-blue-600 '
                    : ' hover:bg-teal-900'
                }`}
              >
                <p className="font-medium  text-sm">{f.username}</p>
              </div>
            ))}
          </div>


         <div className="mb-4  fixed bottom-0 text-black">
                    {/* The Toggle Button (Make sure you didn't delete this!) */}
                    <button
                      type="button"
                      onClick={togglePending}
                      className="w-85 flex items-center justify-between p-3 bg-zinc-500 border gap-19 text-[#192841] font-semibold rounded-lg  cursor-pointer"
                    >
                      <span> <b> Pending Requests</b></span>
                      <span className="text-xs">{isToggle ? '▲ Close' : '▼ Open'}</span>
                    </button>
                  {isToggle && (
                    <div className="p-3 border-none  rounded-lg text-white">
                      
                      {/* Loop through incoming requests */}
                      {pendingRequests.length === 0 ? (
                        <div className="text-xs text-zinc-400 text-center py-2 mb-2">
                          No pending requests
                        </div>
                      ) : (
                        pendingRequests.map((req) => (
                          <div key={req.id} className="flex justify-between items-center  p-2  rounded-lg border">
                            {/* Username on the Left */}
                            <span className="text-xs text-zinc-200 font-medium truncate  max-w-120px">
                            <b><i> {req.profiles?.username || 'Unknown User'}</i></b>  
                            </span>
                            
                            {/* Action Buttons on the Right */}
                            <div className="flex gap-2">
                              <span
                                onClick={() => handleAcceptRequest(req.id)}
                                className="text-xs text-rose p-1 rounded cursor-pointer "
                              >
                              <b><Check /></b> 
                              </span>
                              <span
                                onClick={() => handleDeclineRequest(req.id)}
                                className="text-xs  text-emerald p-1 rounded cursor-pointer "
                              >
                                <X />
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                  </div>
           </aside>


        {/* Chat Area */}
        <main className="flex-1 mr-2 mb-2 h-screen bg-zinc-950 scrollbar-none overflow-auto  ">
         {activeChat ? (
            <> 
              {/* Chat Header */}
              <div className="p-3 fixed text-brown-400 border-b border-zinc-800  w-full ml-  font-bold bg-zinc-950 ">
                {activeChat.username|| activeChat?.name}
             
               <span className="text-xs ml-1 font-normal ">
                        {isFriendTyping ? (
                          <span className="typing font-medium animate-pulse">typing...</span>
                        ) : onlineUsers[targetChatId]?.length > 0 ? (
                          <span className="text-green-200  items-center gap-1">
                            <span className="text-[10px]">●</span> Online
                          </span>
                        ) : activeChat?.last_seen ? (
                          <span className="text-zinc-300" >
                            Last seen : {formatExactLastSeen(activeChat.last_seen || activeChat.Last_seen)}
                          </span>
                        ) : (
                          <span className="offline">Offline</span>
                        )}
                      </span> </div>

              {/* Messages Area */}
              <div  className=" p-2 space-y-3 mt-25.5 gap-2 mb-12 ">
                {messages.filter(Boolean).map((msg, idx) => {
                  const isMe = msg.sender === user?.id;

                    // Group reactions by emoji count
                  const reactionCounts = (msg.message_reactions || []).reduce((acc, curr) => {
                    acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                    return acc;
                  }, {});

                  return (
                    
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col w-full rounded-full   ${isMe ? 'items-end' : 'items-start'}`}
                    > 
                    <span
              className={`text-xxs   mt-1  py-1 ${
                isMe ? 'text-blue-200' : 'text-zinc'
              }`}
            >
              {formatTime(msg.created_at)}
            </span>

                  <div classname= "relative inline-block">
                   
                        {!isMe && (
                          <div
                            onClick={() =>
                              setActiveEmojiMenu(activeEmojiMenu === msg.id ? null : msg.id)
                            }
                            className=" group-hover:opacity-100 transition cursor-pointer  hover:text-white"
                          >
                            <Smile size={16} color='#ffffff' /> 
                          </div>
                        )}
                        
                        {activeEmojiMenu === msg.id && 
                        <div className="  bg-gray-200 rounded-xl p-1 cursor-pointer  flex gap-3  ">
                        {['❤️', '😂', '🔥', '👍', '😮'].map((emoji) => (
                              <div
                                key={emoji}
                                onClick={() => handleToggleReaction(msg.id, emoji)}
                                className="cursor-pointer hover:scale-129 text-base"
                              >
                                {emoji} 
                              </div>
                        ))}
            </div> 
            }</div>

                      <div
                       className={`inline-block text-sm ${
                            msg.file_url || msg.is_sticker
                              ? 'bg-transparent p-0'
                              : isMe
                              ? 'bg-zinc-800 text-white px-4 py-2 rounded-br-none rounded-2xl'
                              : 'bg-zinc-8 text-zinc-100 px-4 py-2 rounded-bl-none rounded-2xl'
                          }`} >
                             {msg.file_url ? (
                          <img
                            src={msg.file_url}
                            alt="uploaded content"
                            className="w-full max-w-xs md\:max-w-sm max-h-60 rounded-2xl object-cover cursor-pointer hover:opacity-95   "
                          />
                        ) : msg.is_sticker ? (
                          <span className="text-5xl select-none leading-none drop-shadow-md">{msg.text}</span>
                        ) : (
                          <p className="whitespace-pre-wrap wrap-break-words">{msg.text}</p>
                        )}
                      </div> 
                      {/* Delete */}
                       {isMe && (
                              <div
                                onClick={() => handleDeleteMessage(msg.id)}
                                title="Delete message"
                                className=" group-hover:opacity-100 text-amber-50 transition-opacity p-1 cursor-pointer  rounded shrink-0"
                              > 
                                <Trash2 size={15} /> 
                              </div>
                            )}

                            {/* Display Selected Reactions Below Message */}
                      {Object.keys(reactionCounts).length > 0 && (
                        <div className="flex gap-1 mt-1 px-1">
                          {Object.entries(reactionCounts).map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="bg-zinc-800 border border-zinc-700 rounded-full text-xs px-2 py-0.5 flex items-center gap-1"
                            >
                              <span>{emoji} </span>
                              <span className="text-zinc-400 text-[10px]">{count}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              
         <div className=" fixed bottom-0 p-2 bg-zinc-950  scrollbar-none  flex items-center gap-1 ">
          <div className="relative flex-none">
              {/* Sticker Drawer */}
              {showStickers && (
                <div className="p-2 absolute  bottom-0 left-0 z-30 mb-13 rounded-full bg-white border flex gap-3">
                  {SYSTEM_STICKERS.map((sticker, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(sticker, '', true)}
                      className=" text-2xl hover:scale-129 bg-white cursor-pointer  rounded-full select-none"
                    >
                      {sticker}
                    </div>
                  ))}
                </div>
              )}
                <div 
                  onClick={() => setShowStickers(!showStickers)}
                  className={`h-11 w-11 flex items-center justify-center   rounded-full  hover:bg-blue-950  transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-0 cursor-pointer${showStickers ? ' text-blue-600 ' : ' text-zinc-400  hover:text-zinc-800'}`}
                >
                 <SmilePlus color="#ffffff" strokeWidth={0.75}  />
                </div>
               </div>

                <label className="h-11 w-11 flex items-center justify-center  hover:bg-blue-950 text-zinc-400 hover:text-zinc-200 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95">
                 <Upload color="#ffffff" strokeWidth={0.75} />
                  <input type="file" accept='image/*' onChange={handleFileUpload} className="hidden" />
                </label>

                <input
                  type="text"
                  placeholder={`Message ... ${activeChat.username|| activeChat?.name}`}
                  className="flex-1  bg-zinc-800 border border-zinc-700 rounded-full p-4 font-white w font-bold text-sm "
                  value={typedMessage}
                  onChange={handleTypedMessageChange}
                  onKeyDown={(e) =>{
                   if (e.key === 'Enter' && typedMessage.trim()) {
                            handleSendMessage(typedMessage, '', false);
                          }
                    }}
                />

                <div
                  onClick={() =>
                    typedMessage.trim() && handleSendMessage(typedMessage, '', false)
                  }
                  className="bg-blue-950  border-none p-3 rounded-full cursor-pointer  "
                >
               <b>  <Send color="#ffffff" strokeWidth={0.75} /> </b>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white mt-50">
             Select or search a contact connection profile to discuss who are we spilling today?🎀
            </div>
          )}
        </main>
      </div>

      {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-zinc-8 border  p-8 rounded-2xl shadow-2xl  mx-4 text-center">
                <h3 className="text-lg font-bold text-white mb-2">Log Out?</h3>
                <p className="text-sm text-zinc-400 mb-6">
                  Are you sure you want to log out of your account?
                </p>
                
                <div className="flex gap-3 justify-end ">
                  <div
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 bg-zinc-800 border-none hover:bg-amber-100 rounded-xl  cursor-pointer"
                  >
                    Cancel
                  </div>
                  <div
                    onClick={() => {
                      setShowLogoutConfirm(false);
                      handleLogout();
                    }}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-white rounded-xl transition cursor-pointer"
                  >
                    Log Out
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* Login Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <Login
            isLogIn={isLogIn}
            setIsLogIn={setIsLogIn}
            closeForm={() => setIsOpen(false)}
            setIsLoggedIn={setIsLoggedIn}
            setUser={setUser}
          />
        </div>
      )}
      
    </div>
  );
}