import React, { useState, useEffect } from 'react'

const Loader = () => {
  const [showNexus, setShowNexus] = useState(false)

  useEffect(() => {
    //  1 second (1000ms)
    const timer = setTimeout(() => {
      setShowNexus(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className='bg-c w-full h-screen flex items-center justify-center relative overflow-hidden'>
      
     <div className='absolute w-72 h-72 bg-purple-600/30 rounded-full blur-90px animate-pulse pointer-events-none' 
     style={{
          background: 'radial-gradient(circle, rgba(200, 142, 128, 0.25) 0%, rgba(10, 9, 11, 0) 70%)'
        }}
        />

     {/* Animated  Text */}
     <div className='relative z-10 flex flex-col items-center gap-2'>
        <h1 
         className='cormorant-garamond-uniquifier font-bold -m-2 leading-none tracking-widest text-6xl md:text-7xl animate-pulse text-center animate-fade-in'
        style={{
           textShadow: '0 0 7px #e3b1a2, 0 0 18px rgba(200, 142, 128, 0.8), 0 0 35px rgba(200, 142, 128, 0.5),  0 0 70px rgba(200, 142, 128, 0.3)'
         }}
       >
          LUMINA
       </h1>

        <h2 
          className={`cutive-mono-regular  tracking-widest mt-5 text-center animate-fade-in-delayed ${showNexus ? 'opacity-100' : 'opacity-0'}`}
        >
          Nexus Chat
        </h2>
        
      </div>
    </div>
  )
}

export default Loader