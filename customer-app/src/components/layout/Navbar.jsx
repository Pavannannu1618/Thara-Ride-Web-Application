import React from 'react';
import { Bell } from 'lucide-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const { user }          = useSelector((s) => s.auth);
  const { notifications } = useSelector((s) => s.ui);
  const unread            = notifications.filter((n) => !n.isRead).length;

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-2">
      <div className="max-w-md mx-auto flex items-center justify-between
        bg-dark-800/70 backdrop-blur-2xl rounded-2xl px-4 py-2.5
        border border-white/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.3)]">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center text-sm shadow-lg">
            🛺
          </div>
          <span className="font-display font-bold text-white text-lg tracking-tight">
            Thara<span className="text-primary-500">.</span>
          </span>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-1.5">
          {/* Notifications */}
          <Link to="/notifications"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/8 transition-colors">
            <Bell size={18} className="text-white/60" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-primary-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold border border-dark-800">
                {unread}
              </span>
            )}
          </Link>

          {/* Avatar */}
          <Link to="/profile">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500/30 to-primary-700/20 border border-primary-500/30 flex items-center justify-center">
              <span className="text-sm font-bold text-primary-400">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;