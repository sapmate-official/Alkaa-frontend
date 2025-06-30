import React from 'react';

interface LoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Lightweight, CSS-only loader component
const Loader: React.FC<LoaderProps> = ({ 
  text = "Loading...", 
  size = 'lg',
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] w-full h-full ${className}`}>
      <div 
        className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-muted-foreground mt-3 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default Loader;