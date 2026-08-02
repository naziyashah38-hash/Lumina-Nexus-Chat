// import React, { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import Welcome from './components/Welcome'; // This path will now resolve perfectly!

// const App = () => {
//   const [isLogin, setIsLogin] = useState(true);
//   const [isOpen, setIsOpen] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [user, setUser] = useState(null);
//   const [socket, setSocket] = useState(null);

//   useEffect(() => {
//     const token = localStorage.getItem('token');
//     const savedUser = localStorage.getItem('user');
//     if (token && savedUser) {
//       try {
//         setUser(JSON.parse(savedUser));
//         setIsLoggedIn(true);
//       } catch (e) {
//         localStorage.clear();
//       }
//     }
//   }, []);

//   useEffect(() => {
//     if (isLoggedIn && user) {
//       const newSocket = io('http://localhost:5000');
//       newSocket.emit('register-active-user', user.id || user._id);
//       setSocket(newSocket);
//       return () => newSocket.close();
//     }
//   }, [isLoggedIn, user]);

//   const handleLogout = () => {
//     localStorage.clear();
//     setUser(null);
//     setIsLoggedIn(false);
//     if (socket) socket.disconnect();
//   };

//   return (
//     <div className="bg-zinc-950 min-h-screen text-white">
//       <Welcome
//         isLogin={isLogin}
//         setIsLogin={setIsLogin}
//         isOpen={isOpen}
//         setIsOpen={setIsOpen}
//         isLoggedIn={isLoggedIn}
//         setIsLoggedIn={setIsLoggedIn}
//         user={user}
//         setUser={setUser}
//         socket={socket}
//         onLogout={handleLogout}
//       />
//     </div>
//   );
// };

// export default App;


import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import Welcome from './components/Welcome';
LucideImport
  import { LucideImport } from 'lucide-react';

const App = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);

  // Auto-login on page load/refresh
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
        setIsLoggedIn(true);
      } catch (e) {
       localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);



  // Connect socket whenever user is logged in
  useEffect(() => {
    if (isLoggedIn && user) {
      const newSocket = io('http://localhost:5000');
      const userId = user.id || user._id;
      
      newSocket.emit('register-active-user', userId);
      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    } else if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  }, [isLoggedIn, user]);

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setIsLoggedIn(false);
    if (socket) socket.disconnect();
  };

  return (
    <div className="bg-zinc-950 min-h-screen text-white">
      <Welcome
        isLogin={isLogin}
        setIsLogin={setIsLogin}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        user={user}
        setUser={setUser}
        socket={socket}
        onLogout={handleLogout}
      />
    </div>
  );
};

export default App;