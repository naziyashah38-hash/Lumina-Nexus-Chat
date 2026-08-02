// const express = require('express');
// const http = require('http');
// const { Server } = require('socket.io');
// const cors = require('cors');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, { cors: { origin: "*" } });

// app.use(cors());
// app.use(express.json());

// // Ensure uploads folder exists dynamically
// const uploadDir = path.join(__dirname, 'uploads');
// if (!fs.existsSync(uploadDir)){
//     fs.mkdirSync(uploadDir);
// }
// app.use('/uploads', express.static(uploadDir));

// // In-Memory Database Storage Layers
// const users = new Map(); 
// const onlineUsers = new Map(); // maps userId -> socketId
// const messages = []; // stores complete chat objects [{sender, recipient, text, fileUrl, isSticker}]

// // Storage Configuration for Image Processing
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, `${Date.now()}-${file.originalname}`);
//   }
// });
// const upload = multer({ storage });

// // --- REST API ENDPOINTS ---

// // Dynamic Mock Auth Endpoint
// app.post('/api/auth/action', (req, res) => {
//   const { username, email, isLogin } = req.body;
//   let user = Array.from(users.values()).find(u => u.username.toLowerCase() === username.toLowerCase());

//   if (!isLogin && !user) {
//     const mockId = `user_${Date.now()}`;
//     user = { _id: mockId, id: mockId, username, email: email || '', friends: [] };
//     users.set(mockId, user);
//   }

//   if (!user) return res.status(400).json({ error: 'User profiles not found' });
//   res.json({ token: 'mock_expert_token', user: { id: user._id, _id: user._id, username: user.username, friends: user.friends } });
// });

// // Global Directory Search
// app.get('/api/users/search', (req, res) => {
//   const { query, currentUserId } = req.query;
//   const filtered = Array.from(users.values())
//     .filter(u => u._id !== currentUserId && u.username.toLowerCase().includes(query.toLowerCase()))
//     .map(u => ({ _id: u._id, username: u.username }));
//   res.json(filtered);
// });

// // Fetch Active Friends List
// app.get('/api/users/:userId/friends', (req, res) => {
//   const user = users.get(req.params.userId);
//   if (!user) return res.json([]);
  
//   const friendObjects = (user.friends || []).map(fId => users.get(fId)).filter(Boolean);
//   res.json(friendObjects);
// });

// // Add Connection Link Relationship Pipeline
// app.post('/api/users/add-friend', (req, res) => {
//   const { userId, friendId } = req.body;
  
//   const user1 = users.get(userId);
//   const user2 = users.get(friendId);

//   if (user1 && user2) {
//     if (!user1.friends.includes(friendId)) user1.friends.push(friendId);
//     if (!user2.friends.includes(userId)) user2.friends.push(userId);
    
//     // Broadcast real-time refresh to both targets if online
//     const s1 = onlineUsers.get(userId);
//     const s2 = onlineUsers.get(friendId);
//     if (s1) io.to(s1).emit('friend-list-updated');
//     if (s2) io.to(s2).emit('friend-list-updated');
    
//     return res.json({ success: true, message: 'Connected successfully' });
//   }
//   res.status(400).json({ error: 'Profiles not found' });
// });

// // Chat History Log Retrieval 
// app.get('/api/messages', (req, res) => {
//   const { sender, recipient } = req.query;
//   const filteredLogs = messages.filter(m => 
//     (m.sender === sender && m.recipient === recipient) || 
//     (m.sender === recipient && m.recipient === sender)
//   );
//   res.json(filteredLogs);
// });

// // Media/Sticker Upload Router Engine
// app.post('/api/messages/upload', upload.single('image'), (req, res) => {
//   if (!req.file) return res.status(400).json({ error: 'Upload broken' });
//   res.json({ fileUrl: `http://localhost:5000/uploads/${req.file.filename}` });
// });

// // --- REAL-TIME COMMUNICATION ENGINE ---
// io.on('connection', (socket) => {
//   socket.on('register-active-user', (userId) => {
//     onlineUsers.set(userId, socket.id);
//     io.emit('user-status-changed', Array.from(onlineUsers.keys()));
//   });

//   socket.on('send-direct-message', (data) => {
//     const { sender, recipient, text, fileUrl, isSticker } = data;
//     const outboundPayload = { 
//       _id: `msg_${Date.now()}`, 
//       sender, 
//       recipient, 
//       text: text || '', 
//       fileUrl: fileUrl || '', 
//       isSticker: isSticker || false,
//       createdAt: new Date() 
//     };
    
//     messages.push(outboundPayload);
    
//     const targetSocket = onlineUsers.get(recipient);
//     const senderSocket = onlineUsers.get(sender);
    
//     if (targetSocket) io.to(targetSocket).emit('receive-direct-message', outboundPayload);
//     if (senderSocket) io.to(senderSocket).emit('receive-direct-message', outboundPayload);
//   });

//   socket.on('disconnect', () => {
//     for (let [uid, sid] of onlineUsers.entries()) {
//       if (sid === socket.id) { 
//         onlineUsers.delete(uid); 
//         break; 
//       }
//     }
//     io.emit('user-status-changed', Array.from(onlineUsers.keys()));
//   });
// });

// server.listen(5000, () => console.log('🚀 Enhanced Backend engine online on port 5000'));

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

// Ensure uploads folder exists dynamically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// In-Memory Database Storage Layers
const users = new Map(); 
const onlineUsers = new Map(); // maps userId -> socketId
const messages = []; // stores complete chat objects [{sender, recipient, text, fileUrl, isSticker}]

// Storage Configuration for Image Processing
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// --- REST API ENDPOINTS ---

// Dynamic Mock Auth Endpoint
app.post('/api/auth/action', async (req, res) => {
  const { username, email, password, isLogin } = req.body;

  if (isLogin) {
    // --- LOGIN LOGIC ---
    // Find user by email or username
    let user = Array.from(users.values()).find((u) => {
      const matchEmail = email && u.email && u.email.toLowerCase() === email.toLowerCase();
  const matchUsername = username && u.username && u.username.toLowerCase() === username.toLowerCase();
  return matchEmail || matchUsername;}
    );

    if (!user) {
      return res.status(400).json({ error: "User profile not found. Please register." });
    }

    // Verify password (add password comparison logic/hash checking here)
    if (user.password !== password) {
      return res.status(400).json({ error: "Invalid password." });
    }

    return res.json({
      token: "mock_export_token",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        friends: user.friends || []
      }
    });

  } else {
    // --- REGISTER LOGIC ---
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required for registration." });
    }
    // Check if user already exists
    let existingUser = Array.from(users.values()).find(
      (u) =>{
       const matchEmail = email && u.email && u.email.toLowerCase() === email.toLowerCase();
  const matchUsername = username && u.username && u.username.toLowerCase() === username.toLowerCase();
  return matchEmail || matchUsername;}
    );

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email or username." });
    }

    // Create new user object
    const newUser = {
      _id: Date.now().toString(),
      username,
      email,
      password, // Note: Always hash passwords with bcrypt in production!
      friends: []
    };

    users.set(newUser._id, newUser);

    return res.json({
      token: "mock_export_token",
      user: {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        friends: []
      }
    });
  }
});

// Global Directory Search
app.get('/api/users/search', (req, res) => {
  const { query, currentUserId } = req.query;
  const filtered = Array.from(users.values())
    .filter(u => u._id !== currentUserId && u.username.toLowerCase().includes(query.toLowerCase()))
    .map(u => ({ _id: u._id, username: u.username }));
  res.json(filtered);
});

// Fetch Active Friends List
app.get('/api/users/:userId/friends', (req, res) => {
  const user = users.get(req.params.userId);
  if (!user) return res.json([]);
  
  const friendObjects = (user.friends || []).map(fId => users.get(fId)).filter(Boolean);
  res.json(friendObjects);
});

// Add Connection Link Relationship Pipeline
app.post('/api/users/add-friend', (req, res) => {
  const { userId, friendId } = req.body;
  
  const user1 = users.get(userId);
  const user2 = users.get(friendId);

  if (user1 && user2) {
    if (!user1.friends.includes(friendId)) user1.friends.push(friendId);
    if (!user2.friends.includes(userId)) user2.friends.push(userId);
    
    // Broadcast real-time refresh to both targets if online
    const s1 = onlineUsers.get(userId);
    const s2 = onlineUsers.get(friendId);
    if (s1) io.to(s1).emit('friend-list-updated');
    if (s2) io.to(s2).emit('friend-list-updated');
    
    return res.json({ success: true, message: 'Connected successfully' });
  }
  res.status(400).json({ error: 'Profiles not found' });
});

// Chat History Log Retrieval 
app.get('/api/messages', (req, res) => {
  const { sender, recipient } = req.query;
  const filteredLogs = messages.filter(m => 
    (m.sender === sender && m.recipient === recipient) || 
    (m.sender === recipient && m.recipient === sender)
  );
  res.json(filteredLogs);
});

// Media/Sticker Upload Router Engine
app.post('/api/messages/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Upload broken' });
  res.json({ fileUrl: `http://localhost:5000/uploads/${req.file.filename}` });
});

// --- REAL-TIME COMMUNICATION ENGINE ---
io.on('connection', (socket) => {
  socket.on('register-active-user', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('user-status-changed', Array.from(onlineUsers.keys()));
  });

  socket.on('send-direct-message', (data) => {
    const { sender, recipient, text, fileUrl, isSticker } = data;
    const outboundPayload = { 
      _id: `msg_${Date.now()}`, 
      sender, 
      recipient, 
      text: text || '', 
      fileUrl: fileUrl || '', 
      isSticker: isSticker || false,
      createdAt: new Date() 
    };
    
    messages.push(outboundPayload);
    
    const targetSocket = onlineUsers.get(recipient);
    const senderSocket = onlineUsers.get(sender);
    
    if (targetSocket) io.to(targetSocket).emit('receive-direct-message', outboundPayload);
    if (senderSocket) io.to(senderSocket).emit('receive-direct-message', outboundPayload);
  });

  socket.on('disconnect', () => {
    for (let [uid, sid] of onlineUsers.entries()) {
      if (sid === socket.id) { 
        onlineUsers.delete(uid); 
        break; 
      }
    }
    io.emit('user-status-changed', Array.from(onlineUsers.keys()));
  });
});

server.listen(5000, () => console.log('🚀 Enhanced Backend engine online on port 5000'));