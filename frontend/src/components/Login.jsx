import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

 export default function Login({ isLogin, setIsLogin, closeForm, setIsLoggedIn, setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        // Log in user
        const { data, error: loginErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (loginErr) throw loginErr;

        // Fetch user profile details
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        setUser(profile || { id: data.user.id, email: data.user.email });
        setIsLoggedIn(true);
        closeForm();
      } else {
        // Register new user
        const { data: authData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;

        if (authData.user) {
          // Insert metadata into profiles table
          const { error: profileErr } = await supabase.from('profiles').insert([
            {
              id: authData.user.id,
              username,
              email,
            },
          ]);
          if (profileErr) throw profileErr;

          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

          setUser(profile);
          setIsLoggedIn(true);
          closeForm();
        }
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="relative p-6 w-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-white text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 text-center">
            {error}
          </div>
        )}

        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            required
            className="p-3 rounded-full bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        )}

        <input
          type="email"
          placeholder="Email Address"
          required
          className="p-3 rounded-full bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          required
          className="p-3 rounded-full bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="bg-blue-600 font-medium p-3 rounded-full text-white">
          {isLogin ? 'Log In' : 'Register'}
        </button>

        <p
          className="text-xs text-gray-400 text-center cursor-pointer hover:underline"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
        >
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </p>
      </form>
    </div>
  );
}