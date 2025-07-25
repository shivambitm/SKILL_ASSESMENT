import React, { useEffect, useState } from 'react';

const NotFound: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const timeString = currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
  const dateString = formatDate(currentTime);

  return (
    <div style={{
      margin: 0,
      padding: 0,
      width: '100vw',
      height: '100vh',
      minWidth: '100vw',
      minHeight: '100vh',
      fontFamily: 'Montserrat, Arial, sans-serif',
      background: 'linear-gradient(135deg, #ba1c1c 0%, #7f1d1d 100%)',
      color: '#fff',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      textAlign: 'center',
      userSelect: 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999
    }}>
      <div style={{
        width: '100vw',
        height: '100vh',
        maxWidth: '100vw',
        maxHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'transparent',
        padding: '2vw'
      }}>
        <h1 style={{
          fontSize: '8vw',
          fontWeight: 900,
          margin: '0 0 0.2em 0',
          letterSpacing: '10px',
          textShadow: '0 4px 36px #900404bb, 0 2px 6px #ffbdbd',
          userSelect: 'text',
          animation: 'heartbeat 1.45s infinite',
          lineHeight: 1
        }}>404</h1>
        
        <div style={{
          fontSize: '2vw',
          fontWeight: 700,
          color: '#fffbe8',
          marginBottom: '2vw',
          userSelect: 'text'
        }}>This page isn't here – but you are!</div>
        
        <section style={{
          background: 'rgba(255,255,255,0.13)',
          borderRadius: '1em',
          boxShadow: '0 2px 16px #b91c1ca1',
          padding: '2vw',
          marginBottom: '2vw',
          fontSize: '1.5vw',
          color: '#fff',
          maxWidth: '60vw',
          textAlign: 'left',
          overflowWrap: 'break-word',
          userSelect: 'text'
        }}>
          <strong>Possible reasons:</strong>
          <ul style={{
            margin: '1vw 0 0 0',
            paddingLeft: '2vw',
            listStyle: 'disc'
          }}>
            <li style={{ marginBottom: '1vw' }}>The link you clicked is broken or outdated.</li>
            <li style={{ marginBottom: '1vw' }}>The URL might have a typo or misspelling.</li>
            <li style={{ marginBottom: '1vw' }}>The resource is private or does not exist.</li>
            <li style={{ marginBottom: '1vw' }}>The resource was removed or has moved.</li>
            <li style={{ marginBottom: '1vw' }}>Your browser is using an outdated cache.</li>
          </ul>
        </section>

        <div style={{
          fontSize: '1vw',
          color: '#fde68a',
          margin: '1vw 0',
          userSelect: 'text',
          overflowWrap: 'break-word'
        }}>Attempted URL: {window.location.pathname}</div>
        
        <div style={{
          fontSize: '1vw',
          color: '#fde68a',
          margin: '1vw 0',
          userSelect: 'text',
          overflowWrap: 'break-word'
        }}>Time: {timeString} - {dateString}</div>
        
        <div style={{
          fontSize: '1vw',
          color: '#ffe4e6',
          opacity: 0.83,
          marginTop: '2vw',
          userSelect: 'text'
        }}>&copy; {new Date().getFullYear()} Skill Assessment Team. All rights reserved.</div>
      </div>
      
      <style>{`
        @keyframes heartbeat {
          0%, 100% { transform: scale(1); }
          20% { transform: scale(1.18); }
          40% { transform: scale(0.97); }
          60% { transform: scale(1.1); }
          80% { transform: scale(1); }
        }
        @media (max-width: 900px) {
          h1 { font-size: 12vw !important; }
          .subtitle, .reasons, .url-path, .timestamp, .footer { font-size: 3vw !important; }
          .reasons { max-width: 90vw !important; padding: 1.5vw !important; }
        }
      `}</style>
    </div>
  );
};

export default NotFound;