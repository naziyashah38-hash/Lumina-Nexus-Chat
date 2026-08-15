import React, { useState, useEffect } from 'react'
import Loader from './components/Loader'
import Welcome from './components/Welcome'
import Login from './components/Login'
import { supabase } from './supabaseClient'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [isLogIn, setIsLogIn] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false);
 
  useEffect(() => {
    document.title = "Lumina Nexus";
  }, []);

  useEffect(() => {
    const loaderTimer = setTimeout(() => {
      setLoading(false)
    }, 4500) 

    return () => clearTimeout(loaderTimer)
  }, [])

  const handleSearchInteraction = () => {
  if (!isLoggedIn) {
    setIsLogIn(false) 
    setIsOpen(true) 
  }
}

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(profile)  
        setIsLoggedIn(true)
        setIsOpen(false)
      } else {
        
        setIsOpen(true)
      }
    }

    checkSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setUser(profile)
        setIsLoggedIn(true)
        setIsOpen(false)
      } else {
        setUser(null)
        setIsLoggedIn(false)
        setIsOpen(true)
      }
    })

    return () => authListener?.subscription?.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setIsLoggedIn(false)
    setIsOpen(true)
  }

 
  if (loading) {
    return <Loader />
  }

  // MAIN APPLICATION SCREEN
  return (
    <div className='w-full h-screen bg-[#0a090b] text-white relative overflow-hidden'>
      {/* 1. Main Welcome/Chat Interface */}
      <Welcome
        isLogIn={isLogIn}
        setIsLogIn={setIsLogIn}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        user={user}
        setUser={setUser}
        handleLogout={handleLogout}
        onSearchInteraction={handleSearchInteraction}
      />

      {/* 2. Login Popup (Shown when user is not logged in) */}
      {!isLoggedIn && isOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm '>
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
  )
}