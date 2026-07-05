import React from 'react';
import { X, Menu, Bell, User, LogOut } from 'lucide-react';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
  };

  return (
    <nav className="bg-slate-800 border-b border-slate-700 shadow-lg">
      <div className="px-6 py-4 flex items-center justify-between">
        <button
          onClick={onMenuClick}
          className="text-slate-400 hover:text-white transition"
        >
          <Menu size={24} />
        </button>

        <div className="flex items-center gap-6">
          <button className="relative text-slate-400 hover:text-white transition">
            <Bell size={20} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 text-slate-300 hover:text-white transition"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                {user?.email?.[0]?.toUpperCase()}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{user?.email}</span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg py-2 z-10">
                <button className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 hover:text-white flex items-center gap-2">
                  <User size={16} /> Profile
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-400 hover:bg-slate-600 flex items-center gap-2"
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
