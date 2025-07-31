import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff } from 'lucide-react';

interface AdminPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (passcode: string) => void;
  userInfo: {
    email: string;
    firstName: string;
    lastName: string;
    picture: string;
  };
  isLoading?: boolean;
}

const AdminPasscodeModal: React.FC<AdminPasscodeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userInfo,
  isLoading = false
}) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setError('Admin passcode is required');
      return;
    }
    setError('');
    onSubmit(passcode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Admin Verification
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Verify admin access
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            {userInfo.picture ? (
              <img
                src={userInfo.picture}
                alt={userInfo.firstName}
                className="w-12 h-12 rounded-full"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <span className="text-lg font-medium text-gray-600 dark:text-gray-300">
                  {userInfo.firstName.charAt(0)}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {userInfo.firstName} {userInfo.lastName}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {userInfo.email}
              </p>
            </div>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            To register as an administrator, please enter the admin passcode:
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Passcode
              </label>
              <div className="relative">
                <input
                  type={showPasscode ? 'text' : 'password'}
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter admin passcode"
                  className="w-full p-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasscode(!showPasscode)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
                >
                  {showPasscode ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {error}
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!passcode.trim() || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                {isLoading ? 'Verifying...' : 'Continue as Admin'}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              💡 Don't have admin access? You can continue as a regular user by closing this dialog.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPasscodeModal;