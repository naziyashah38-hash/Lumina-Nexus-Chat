import React, { useState, useEffect } from 'react';

const Loader = ({ isLoading = true }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const messages = [
    "Brewing tea... ☕",
    "Connecting to the nexus... ⚡",
    "Finding who we're spilling tea with... 🎀",
    "Waking up the chat server... 💬"
  ];

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
        setFade(true);
      }, 300);
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoading, messages.length]);

  if (!isLoading) return null;

  return (
    <div style={styles.overlay}>
      {/* Soft Ambient Floating Orbs */}
      <div style={{ ...styles.ambientGlow, ...styles.pinkGlow }}></div>
      <div style={{ ...styles.ambientGlow, ...styles.blueGlow }}></div>

      {/* Main Content Wrapper without Box Frame */}
      <div style={styles.contentWrapper}>
        {/* Animated Gossip / Chat Badge Visual */}
        <div style={styles.chatWrapper}>
          <div style={styles.chatIcon}>💬</div>
          <div style={styles.teaBadge}>☕</div>
          <span style={{ ...styles.sparkle, top: '-8px', right: '-12px' }}>✨</span>
          <span style={{ ...styles.sparkle, bottom: '-6px', left: '-10px', animationDelay: '0.8s' }}>✨</span>
        </div>

        {/* Brand Header */}
        <div style={styles.brandTitle}>
          Lumina Nexus <span style={styles.chatBadge}>CHAT</span>
        </div>

        {/* Status Message */}
        <div
          style={{
            ...styles.statusText,
            opacity: fade ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {messages[messageIndex]}
        </div>

        {/* Soft Pastel Bouncing Dots */}
        <div style={styles.waveDots}>
          <span style={{ ...styles.dot, backgroundColor: '#fca5a5', animationDelay: '-0.32s' }}></span>
          <span style={{ ...styles.dot, backgroundColor: '#c084fc', animationDelay: '-0.16s' }}></span>
          <span style={{ ...styles.dot, backgroundColor: '#ffffff', animationDelay: '0s' }}></span>
        </div>
      </div>

      {/* Embedded CSS Animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@400;600;700&family=Quicksand:wght@500;700&display=swap');

        @keyframes floatGlow {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          50% { transform: translate(30px, 20px) scale(1.15); opacity: 0.7; }
        }

        @keyframes floatChat {
          0%, 100% { transform: translateY(0) rotate(-3deg); filter: drop-shadow(0 0 12px rgba(244, 114, 182, 0.5)); }
          50% { transform: translateY(-10px) rotate(3deg); filter: drop-shadow(0 0 22px rgba(244, 114, 182, 0.8)); }
        }

        @keyframes bounceTea {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(10deg); }
        }

        @keyframes twinkle {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.3); opacity: 1; }
        }

        @keyframes bounceDot {
          0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
          40% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 12px rgba(255, 255, 255, 0.8); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    /* Soft slate-blue background (#748d9a base) */
    background: 'radial-gradient(circle at 50% 40%, #748d9a 0%, #475a68 100%)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    overflow: 'hidden',
  },
  ambientGlow: {
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(90px)',
    pointerEvents: 'none',
  },
  pinkGlow: {
    top: '20%',
    left: '25%',
    width: '320px',
    height: '320px',
    background: 'rgba(244, 114, 182, 0.3)',
    animation: 'floatGlow 8s ease-in-out infinite',
  },
  blueGlow: {
    bottom: '20%',
    right: '25%',
    width: '380px',
    height: '380px',
    background: 'rgba(255, 255, 255, 0.2)',
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  chatWrapper: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '25px',
  },
  chatIcon: {
    fontSize: '3.8rem',
    animation: 'floatChat 2.8s ease-in-out infinite',
  },
  teaBadge: {
    position: 'absolute',
    bottom: '-5px',
    right: '-15px',
    fontSize: '1.8rem',
    animation: 'bounceTea 2.2s ease-in-out infinite',
  },
  sparkle: {
    position: 'absolute',
    fontSize: '1.5rem',
    animation: 'twinkle 1.8s ease-in-out infinite',
  },
  brandTitle: {
    fontFamily: "'Fredoka', sans-serif",
    fontSize: '2.2rem',
    fontWeight: '700',
    letterSpacing: '1px',
    color: '#ffffff',
    marginBottom: '12px',
    textShadow: '0 2px 12px rgba(0, 0, 0, 0.2)',
  },
  chatBadge: {
    color: '#2d3748',
    fontSize: '1.9rem',
  },
  statusText: {
    fontFamily: "'Quicksand', sans-serif",
    fontSize: '1.25rem',
    color: '#f1f5f9',
    height: '32px',
    marginBottom: '28px',
    fontWeight: '600',
    textShadow: '0 1px 6px rgba(0, 0, 0, 0.1)',
  },
  waveDots: {
    display: 'flex',
    gap: '12px',
  },
  dot: {
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    animation: 'bounceDot 1.4s infinite ease-in-out both',
  },
};

export default Loader;