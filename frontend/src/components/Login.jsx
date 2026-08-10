import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

 export default function Login({ isLogIn, setIsLogIn, closeForm, setIsLoggedIn, setUser }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Check for: 1 uppercase, 1 lowercase, 1 digit, 1 special character, min 6 characters
const usernameRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_\-#])[A-Za-z\d@$!%*?&_\-#]{6,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isLogIn) {
    if (!usernameRegex.test(username)) {
      setError(
        'Username must include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character (@$!%*?&_-#).'
      );
      return; // Stop form submission
    }
  }

    try {
      if (isLogIn) {
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
    <div className="w-380px p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl transform-gpu shrink-0">

      <div
          onClick={closeForm}
          type="button"
          className=" mr-1 mb-3 p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full absolute cursor-pointer transition duration-200 ease-in-out"
          aria-label="Close modal"
        >
           <span className=" h-5 font-bold">
            ✕
            </span> 
        </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h2 className="text-2xl font-bold text-white text-center">
          {isLogIn ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="text-red-400 text-xs bg-red-500/10 p-2 rounded border border-red-500/20 text-center whitespace-normal break-words leading-relaxed">
            {error}
          </div>
        )}

         <input
          type="email"
          placeholder="Email Address"
          required
          className="p-3 rounded-1xl bg-zinc-800 border border-zinc-700 text-white focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />


        {!isLogIn && (
         <div className="flex flex-col gap-1">
          <input
            type="text"
            placeholder="Username"
            required 
            className="p-3 rounded-1xl bg-white border border-zinc-700 text-black focus:outline-none"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          
           <p className="text-xxs text-zinc-400 px-3">
      Must contain 1 uppercase, 1 lowercase, 1 number & 1 special character (@$!%*?&_-#)
    </p> 
    </div>
        )}

        <input
          type="password"
          placeholder="Password"
          required
          className="p-3 rounded-1xl bg-white border border-zinc-700 text-black focus:outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit" className="bg-gray-500 font-medium p-3 border  rounded-full text-black">
          {isLogIn ? 'Log In' : 'Register'}
        </button>

        <p
          className="text-xs text-gray-400 text-center cursor-pointer hover:underline"
          onClick={() => {
            setIsLogIn(!isLogIn);
            setError('');
          }}
        >
          {isLogIn ? "Don't have an account? Sign Up" : 'Already have an account? Login'}
        </p>
      </form>
    </div>
  );
}
 