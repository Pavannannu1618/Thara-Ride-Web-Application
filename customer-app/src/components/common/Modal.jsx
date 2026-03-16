import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} bg-dark-800 rounded-t-3xl sm:rounded-3xl p-6 border border-white/10 z-10 max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
          <button onClick={onClose} className="ml-auto p-2 rounded-full hover:bg-white/10 transition-colors">
            <X size={20} className="text-white/60" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;