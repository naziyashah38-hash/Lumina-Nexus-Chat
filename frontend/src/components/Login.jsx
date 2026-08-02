import React, { useState } from 'react';
import axios from 'axios';

const Login = ({ isLogin, setIsLogin, closeForm, setIsLoggedIn, setUser }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

  const payload = isLogin
    ? { username: username || undefined, email: email || undefined, password, isLogin }
    : { username, email, password, isLogin };

    try {
      const res = await axios.post('http://localhost:5000/api/auth/action', payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setUser(res.data.user);
      setIsLoggedIn(true);
      closeForm();
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication Failed');
    }
  };

  return (
    <div className='relative p-3 z-50 animate-fade-in'>
      <form onSubmit={handleSubmit} className='flex flex-col items-center justify-center gap-4 bg-zinc-900  w-[380px] p-8 rounded-2xl border  shadow-2xl'>
        <button  onClick={closeForm}>✕</button>
        <h2 className='text-2xl font-bold tracking-tight mb-2'>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        
        {error && <p className="text-red-400 text-xs bg-red-500/10 w-full p-2 rounded border border-red-500/20 text-center">{error}</p>}
        
        <div className='p-2'>
        {!isLogin && (
          <input type="email" placeholder="Email Address" required className=" p-3 rounded-full bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500 text-sm" value={email} onChange={(e) => setEmail(e.target.value)}/>
        )}
        </div>

        <div className='p-3'>
        <input type="text" placeholder="Username" required className="p-3  rounded-full bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500 text-sm" value={username} onChange={(e) => setUsername(e.target.value)}/></div>
        <input type="password" placeholder="Password" required className=" p-3 rounded-full bg-zinc-800 border border-zinc-700 focus:outline-none focus:border-blue-500 text-sm" value={password} onChange={(e) => setPassword(e.target.value)}/>
        
        <div className='p-3'>
        <button type="submit" className=" font-medium p-3 rounded-full text-sm">
          {isLogin ? 'Log In' : 'Register'}
        </button>
        </div>
        
        <p className="text-xs text-gray-400 mt-2 cursor-pointer hover:underline" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
        </p>
      </form>
    </div>
  );
};

export default Login;