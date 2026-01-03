import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, variant = 'primary', size = 'md', className = '', ...props 
}) => {
  const base = "font-medium rounded-lg transition-colors duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-1";
  
  // EVA Air Colors: 
  // Primary: Evergreen (Emerald-700/800)
  // Secondary: Light/Grey or Orange depending on context
  
  const variants = {
    primary: "bg-emerald-700 text-white hover:bg-emerald-800 disabled:bg-emerald-300",
    secondary: "bg-orange-500 text-white hover:bg-orange-600 disabled:bg-orange-300", 
    danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-200"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};