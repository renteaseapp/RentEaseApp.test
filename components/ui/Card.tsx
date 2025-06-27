
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-white shadow-lg rounded-xl overflow-hidden ${onClick ? 'cursor-pointer hover:shadow-xl transition-shadow duration-200' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface CardContentProps {
    children: React.ReactNode;
    className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({ children, className = ''}) => {
    return <div className={`p-4 md:p-6 ${className}`}>{children}</div>
}
