import React from 'react';

interface JobDescriptionLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const JobDescriptionLoader: React.FC<JobDescriptionLoaderProps> = ({ 
  size = 'sm', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading job description"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default JobDescriptionLoader;
