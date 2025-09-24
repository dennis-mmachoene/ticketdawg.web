import React from 'react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...', fullScreen = true }) => {
  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            {/* Main spinner */}
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
            
            {/* Pulsing dot in center */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          
          <p className="text-secondary-600 text-lg">{text}</p>
          
          {/* Action SA branding */}
          <div className="mt-8 text-center">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-soft">
              <span className="text-white text-xl font-bold">AS</span>
            </div>
            <p className="text-primary-700 font-semibold">Pool Party Ticketing</p>
          </div>
        </div>
      </div>
    );
  }

  // Inline spinner
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6', 
    large: 'w-8 h-8'
  };

  return (
    <div className="flex items-center justify-center space-x-2">
      <div className={`border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin ${sizeClasses[size]}`}></div>
      {text && <span className="text-secondary-600">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;