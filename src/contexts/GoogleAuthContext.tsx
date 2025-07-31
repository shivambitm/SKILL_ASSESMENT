import React, { createContext, useContext, useEffect, useState } from 'react';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface GoogleAuthContextType {
  user: GoogleUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  showPrompt: boolean;
  dismissPrompt: () => void;
}

const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(undefined);

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id';

export const GoogleAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    initializeGoogleAuth();
  }, []);

  const initializeGoogleAuth = async () => {
    try {
      await loadGoogleScript();
      
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Disable automatic prompt - only show on manual trigger
      setShowPrompt(false);

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize Google Auth:', error);
      setIsLoading(false);
    }
  };

  const loadGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.google) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google script'));
      document.head.appendChild(script);
    });
  };

  const handleCredentialResponse = async (response: any, adminPasscode?: string) => {
    try {
      const credential = response.credential;
      
      // Send to backend for verification
      const backendResponse = await fetch('http://localhost:5000/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ credential, adminPasscode }),
      });

      const data = await backendResponse.json();
      
      if (backendResponse.ok) {
        // Store token
        localStorage.setItem('token', data.token);
        
        // Set user data
        setUser({
          id: data.user.id,
          email: data.user.email,
          name: data.user.firstName + ' ' + data.user.lastName,
          picture: data.user.picture || '',
        });

        setShowPrompt(false);
        window.location.reload();
      } else {
        // Handle admin passcode requirement
        if (data.requiresAdminPasscode) {
          return { requiresAdminPasscode: true, userInfo: data.userInfo };
        }
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signIn = async (adminPasscode?: string) => {
    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const result = await handleCredentialResponse(response, adminPasscode);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        
        // Direct prompt without fallback
        window.google.accounts.id.prompt();
      } catch (error) {
        console.error('Sign-in error:', error);
        reject(error);
      }
    });
  };

  const signOut = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('google-auth-prompt-dismissed', 'true');
  };

  return (
    <GoogleAuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        showPrompt,
        dismissPrompt,
      }}
    >
      {children}
    </GoogleAuthContext.Provider>
  );
};

export const useGoogleAuth = () => {
  const context = useContext(GoogleAuthContext);
  if (context === undefined) {
    throw new Error('useGoogleAuth must be used within a GoogleAuthProvider');
  }
  return context;
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    google: any;
  }
}