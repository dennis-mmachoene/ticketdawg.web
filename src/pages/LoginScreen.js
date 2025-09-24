import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const LoginScreen = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    const result = await login(username.trim(), password);
    
    if (!result.success) {
      setError(result.error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-20 h-20 bg-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-medium">
            <span className="text-white text-2xl font-bold">AS</span>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Pool Party</h1>
          <h2 className="text-xl text-secondary-700 mb-2">Ticketing System</h2>
          <p className="text-secondary-500 text-sm">Organizer Access Only</p>
        </div>

        {/* Login Form */}
        <div className="card animate-slide-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card-header">
              <h3 className="text-xl font-semibold text-secondary-900 text-center">
                Sign In
              </h3>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2 text-red-700">
                <AlertCircle size={16} />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input pl-10"
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-secondary-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  ) : (
                    <Eye className="h-5 w-5 text-secondary-400 hover:text-secondary-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="loading-spinner" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 space-y-2 animate-fade-in">
          <p className="text-base font-semibold text-primary-700">Action SA Students Chapter</p>
          <p className="text-sm text-secondary-600">
            Thank you for making your voice heard
          </p>
          <p className="text-sm font-medium text-primary-600">
            #The Future is not a mistake
          </p>
        </div>

        {/* Event Info Card */}
        <div className="mt-8 card animate-fade-in">
          <div className="text-center">
            <h4 className="font-semibold text-secondary-900 mb-3">Event Information</h4>
            <div className="space-y-2 text-sm text-secondary-600">
              <p>📅 <span className="font-medium">04 October 2025</span></p>
              <p>🕒 <span className="font-medium">Starts at 12:00</span></p>
              <p>🎉 BOB (Bring your own bottles)</p>
              <p>🍸 Free food and cocktails provided</p>
              <p>🚌 Free transport available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;