import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import Login from './Login';
import { LogIn, LogOut, Send, Paperclip, UserPlus , SmilePlus , Upload ,Trash2} from 'lucide-react';
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
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [showStickers, setShowStickers] = useState(false);
  const messagesEndRef = useRef(null);

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

  // Fetch rows where you are either user_id OR friend_id
  const { data: rows, error } = await supabase
    .from('friends')
    .select('user_id, friend_id')
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  if (error || !rows || rows.length === 0) {
    setFriends([]);
    return;
  }

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
};

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

    if (error) {
      console.error("Search database error:", error.message);
      return;
    }

    console.log("Search raw results:", data);

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
      .select('*')
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
    if (!activeChat || !user) return;

    const channel = supabase
      .channel('realtime_messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const newMsg = payload.new;
          if (
            (newMsg.sender === user.id && newMsg.recipient === activeChat.id) ||
            (newMsg.sender === activeChat.id && newMsg.recipient === user.id)
          ) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  setMessages((prev) => prev.filter((msg) => msg.id !== messageId));
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

  // 2. Insert connection into Supabase
  const { error } = await supabase.from('friends').insert([
    { user_id: user.id, friend_id: targetId }
  ]);

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

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 w-full px-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
        <h1 className=" cormorant-garamond-uniquifier font-bold text-brown-400 ml-1 tracking-wider ">LUMINA NEXUS </h1>
         <p className=" text-bold ">Lumina said  'HI' 😉</p>
        {isLoggedIn ? (
          <div className="flex items-center gap-2"> 
          <Dot size={36} strokeWidth={3} />
            <span className="text-sm bg-zinc-800 p-2 rounded-full border ">
              {user?.username || user?.email}
            </span>
             <div onClick={handleLogout} className="text-xs p-2 text-red-400 hover:underline"><LogIn color="#808080" strokeWidth={2.75} alt='Log Out' /> </div>
          </div>
        ) : (
          
          <div
            onClick={() => {
             setIsLogIn(true);
              setIsOpen(true);
            }}
            className="text-white p-3 rounded-lg font-bold cursor-pointer font-medium transition"
          >
<UserKey color="#808080" strokeWidth={2.75} alt="Sign In" /> 
          </div>
         
        )}
      </header>

      {/* Main Container */}
      <div className="flex w-full mt-16  ">
        {/* Sidebar */}
        <aside className="fixed top-16 left-0 w-80 h-calc border-r border-zinc-800 p-3 flex flex-col gap-4 bg-zinc-900/50 shrink-0 z-40 overflow-hidden">
          <input
            type="text"
            placeholder="Find someone to spill the tea with...☕"
         className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-white shrink-0 " 
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
            <div className="flex  flex-col gap-2 shrink-0">
              <p className="text-xs  text-zinc-500 p-2 rounded-full tracking-wider">This is the person who are you searching for🤔?</p>
              {searchResults.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-3 bg-zinc-800/80 rounded-lg"
                >
                  <span className="text-sm  ">
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
          <div className="flex-1 overflow-y-auto flex flex-col gap-2">
            <p className="text-xs font-bold text-zinc-500 px-1 uppercase tracking-wider mb-2">Who are we texting today ?👀</p>
            {friends.map((f) => (
              <div
                key={f.id}
                onClick={() => setActiveChat(f)}
                className={`p-3 rounded-xl cursor-pointer transition ${
                  activeChat?.id === f.id
                    ? 'bg-blue-600/20 border border-blue-500'
                    : 'bg-zinc-800/40 hover:bg-zinc-800'
                }`}
              >
                <p className="font-medium text-sm">{f.username}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 mr-2 flex flex-col bg-zinc-950 h-screen pt-16 ml-80">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 fixed text-brown-400 border-b border-zinc-800 mt-0 w-full font-bold bg-zinc-950 ">
                {activeChat.username}
              </div>

              {/* Messages Area */}
              <div className="flex-1  p-4 space-y-3 overflow-y-auto mt-4 custom-scrollbar flex flex-col">
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === user?.id;
                  return (
                    
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col w-full rounded-full  ${isMe ? 'items-end' : 'items-start'}`}
                    > 

                    <span
              className={`text-xxs   mt-1  py-1 ${
                isMe ? 'text-blue-200' : 'text-zinc-400'
              }`}
            >
              {formatTime(msg.created_at)}
            </span>
                      <div
                       className={`inline-block text-sm ${
                            msg.file_url || msg.is_sticker
                              ? 'bg-transparent p-0'
                              : isMe
                              ? 'bg-brown-400 text-white px-4 py-2 rounded-br-none rounded-2xl'
                              : 'bg-zinc-800 text-zinc-100 px-4 py-2 rounded-bl-none rounded-2xl'
                          }`}
                                                >

                          
                        {msg.file_url ? (
                          <img
                            src={msg.file_url}
                            alt="uploaded content"
                            className="w-full max-w-xs md\:max-w-sm max-h-60 rounded-2xl object-cover cursor-pointer hover:opacity-95 transition  "
                          />
                        ) : msg.is_sticker ? (
                          <span className="text-5xl select-none leading-none drop-shadow-md">{msg.text}</span>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        )}
                      </div> 



    {isMe && (
                <div
                  onClick={() => handleDeleteMessage(msg.id)}
                  title="Delete message"
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-red-400 rounded shrink-0"
                >
                  <Trash2 size={15} />
                </div>
              )}

                    </div>
                   
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              

              {/* Sticker Drawer */}
              {showStickers && (
                <div className="p-2  bg-none border  flex gap-3">
                  {SYSTEM_STICKERS.map((sticker, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSendMessage(sticker, '', true)}
                      className=" text-2xl hover:scale-125 bg-none transition cursor-pointer select-none"
                    >
                      {sticker}
                    </div>
                  ))}
                </div>
              )}

              {/* Message Input Controls */}
              <div className="  sticky bottom-0 bg-zinc-950  flex items-center gap-3 w-full backdrop-blur-md ">
                <div
                  onClick={() => setShowStickers(!showStickers)}
                  className={`h-11 w-11 flex items-center justify-center  rounded-full  text-base transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-0 cursor-pointer${showStickers ? ' text-blue-400 ' : ' text-zinc-400  hover:text-zinc-200'}`}
                >
                 <SmilePlus color="#808080" strokeWidth={0.75} />
                </div>

                <label className="h-11 w-11 flex items-center justify-center  hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95">
                 <Upload color="#808080" strokeWidth={0.75} />
                  <input type="file" accept='image/*' onChange={handleFileUpload} className="hidden" />
                </label>

                <input
                  type="text"
                  placeholder={`Message ... ${activeChat.username}`}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-full p-4 font-white font-bold text-sm focus:outline-none"
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' &&
                    typedMessage.trim() &&
                    handleSendMessage(typedMessage, '', false)
                  }
                />

                <div
                  onClick={() =>
                    typedMessage.trim() && handleSendMessage(typedMessage, '', false)
                  }
                  className="bg-brown-400 hover:bg-blue-700 border p-3 rounded-full text-sm font-bold transition"
                >
                 <Send color="#ffffff" strokeWidth={0.75} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-500">
             Select or search a contact connection profile to discuss who are we spilling today?🎀
            </div>
          )}
        </main>
      </div>

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