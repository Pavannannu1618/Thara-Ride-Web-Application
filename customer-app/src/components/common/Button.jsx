import React from 'react';

const Button = ({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, loading = false, className = '',
  type = 'button', fullWidth = false,
}) => {
  const base = 'relative overflow-hidden font-semibold rounded-2xl transition-all duration-200 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2 select-none';

  const variants = {
    primary:  'bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-lg shadow-primary-500/20',
    secondary:'bg-white/[0.08] hover:bg-white/[0.14] border border-white/10 text-white',
    danger:   'bg-red-500/90 hover:bg-red-600 text-white shadow-lg shadow-red-500/20',
    ghost:    'bg-transparent hover:bg-white/[0.06] text-white/60 hover:text-white border border-white/10',
    outline:  'bg-transparent border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white',
  };

  const sizes = {
    sm: 'py-2 px-4 text-sm',
    md: 'py-3.5 px-6 text-[15px]',
    lg: 'py-4 px-8 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {loading
        ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        : children
      }
    </button>
  );
};

export default Button;