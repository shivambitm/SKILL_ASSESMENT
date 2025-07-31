import React from 'react';

interface GoogleButtonProps {
  onClick: () => void;
  loading?: boolean;
  type?: 'signin' | 'signup';
  disabled?: boolean;
}

const GoogleButton: React.FC<GoogleButtonProps> = ({ 
  onClick, 
  loading = false, 
  type = 'signin',
  disabled = false 
}) => {
  const buttonText = type === 'signin' ? 'Sign in with Google' : 'Sign up with Google';
  const loadingText = type === 'signin' ? 'Signing in...' : 'Signing up...';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="
        relative overflow-hidden group w-full
        bg-gradient-to-br from-white/20 via-white/10 to-transparent
        dark:from-gray-800/30 dark:via-gray-700/20 dark:to-transparent
        backdrop-blur-xl
        border border-white/30 dark:border-gray-600/30
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        hover:shadow-[0_12px_40px_0_rgba(31,38,135,0.5)]
        px-8 py-4
        rounded-2xl
        font-bold text-lg
        transition-all duration-500 ease-out
        hover:scale-[1.02]
        hover:bg-gradient-to-br hover:from-blue-500/20 hover:via-purple-500/15 hover:to-pink-500/10
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        before:absolute before:inset-0 before:rounded-2xl
        before:bg-gradient-to-br before:from-white/10 before:to-transparent
        before:opacity-0 hover:before:opacity-100
        before:transition-opacity before:duration-500
      "
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/0 via-purple-500/20 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:animate-pulse"></div>
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer"></div>
      </div>
      
      <div className="relative flex items-center justify-center gap-4 text-gray-700 dark:text-gray-200 group-hover:text-white transition-colors duration-300">
        {loading ? (
          <>
            <div className="w-6 h-6 border-3 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="font-extrabold tracking-wide">{loadingText}</span>
          </>
        ) : (
          <>
            <svg className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-extrabold tracking-wide text-xl">{buttonText}</span>
          </>
        )}
      </div>
      
      {/* Bottom glow effect */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-blue-500/0 via-purple-500/50 to-pink-500/0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
    </button>
  );
};

export default GoogleButton;