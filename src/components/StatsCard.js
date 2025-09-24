import React from 'react';

const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color = 'text-primary-700', 
  bgColor = 'bg-primary-100',
  description,
  trend,
  trendDirection = 'up'
}) => {
  return (
    <div className="card hover:shadow-medium transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-4">
            <div className={`${bgColor} p-2.5 rounded-lg transition-all duration-200 group-hover:scale-105`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-secondary-600">{title}</h3>
              {description && (
                <p className="text-xs text-secondary-400 mt-1">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-bold text-secondary-900 group-hover:text-primary-700 transition-colors duration-200">
              {value.toLocaleString()}
            </span>
            
            {trend && (
              <span className={`text-sm font-medium ${
                trendDirection === 'up' ? 'text-green-600' : 
                trendDirection === 'down' ? 'text-red-600' : 
                'text-secondary-500'
              }`}>
                {trendDirection === 'up' ? '+' : trendDirection === 'down' ? '-' : ''}
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Progress bar for visual appeal */}
      <div className="mt-4 bg-secondary-100 rounded-full h-1 overflow-hidden">
        <div 
          className={`h-full ${color.replace('text-', 'bg-')} transition-all duration-1000 ease-out`}
          style={{ 
            width: `${Math.min((value / 65) * 100, 100)}%`,
            animation: 'slideIn 1s ease-out'
          }}
        />
      </div>
    </div>
  );
};

export default StatsCard;