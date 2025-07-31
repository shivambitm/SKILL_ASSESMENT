import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useGoogleAuth } from '../contexts/GoogleAuthContext';
import AdminPasscodeModal from './AdminPasscodeModal';

const GoogleAuthPrompt: React.FC = () => {
  const { showPrompt, signIn, dismissPrompt } = useGoogleAuth();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [pendingUserInfo, setPendingUserInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!showPrompt) return null;

  return (
    <>
      {/* Desktop Prompt - Top Right */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Sign in to skills.shivastra.in
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  with google.com
                </p>
              </div>
            </div>
            <button
              onClick={dismissPrompt}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={async () => {
                try {
                  setIsLoading(true);
                  await signIn();
                } catch (error: any) {
                  if (error.requiresAdminPasscode) {
                    setPendingUserInfo(error.userInfo);
                    setShowAdminModal(true);
                  }
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded text-sm font-medium transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              onClick={dismissPrompt}
              className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Prompt - Top Banner */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    Sign in to skills.shivastra.in with google.com
                  </p>
                </div>
              </div>
              <button
                onClick={dismissPrompt}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded ml-2"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            
            <div className="flex gap-2 mt-3">
              <button
                onClick={async () => {
                  try {
                    setIsLoading(true);
                    await signIn();
                  } catch (error: any) {
                    if (error.requiresAdminPasscode) {
                      setPendingUserInfo(error.userInfo);
                      setShowAdminModal(true);
                    }
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm transition-colors"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Google Sign-in Button for Fallback */}
      <div id="google-signin-button" className="hidden"></div>
      
      {/* Admin Passcode Modal */}
      <AdminPasscodeModal
        isOpen={showAdminModal}
        onClose={() => {
          setShowAdminModal(false);
          setPendingUserInfo(null);
        }}
        onSubmit={async (passcode) => {
          try {
            setIsLoading(true);
            await signIn(passcode);
            setShowAdminModal(false);
            setPendingUserInfo(null);
          } catch (error) {
            console.error('Admin verification failed:', error);
          } finally {
            setIsLoading(false);
          }
        }}
        userInfo={pendingUserInfo}
        isLoading={isLoading}
      />
    </>
  );
};

export default GoogleAuthPrompt;