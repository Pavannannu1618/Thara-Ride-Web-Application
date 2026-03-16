import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Clock, Wallet, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',        icon: Home,   label: 'Home'    },
  { to: '/history', icon: Clock,  label: 'Rides'   },
  { to: '/wallet',  icon: Wallet, label: 'Wallet'  },
  { to: '/profile', icon: User,   label: 'Profile' },
];

const BottomNav = () => (
  <nav className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4">
    <div className="max-w-md mx-auto">
      <div className="bg-dark-800/80 backdrop-blur-2xl rounded-2xl border border-white/[0.06]
        shadow-[0_-4px_24px_rgba(0,0,0,0.4)] flex px-2 py-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2.5 gap-1 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'text-primary-500 bg-primary-500/10'
                  : 'text-white/30 hover:text-white/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  </nav>
);

export default BottomNav;