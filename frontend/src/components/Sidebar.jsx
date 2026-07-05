import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Home, Bot, Mail, Zap, Settings as SettingsIcon, Lock } from 'lucide-react';

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();

  const links = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/agents', icon: Bot, label: 'Agents' },
    { path: '/messages', icon: Mail, label: 'Messages' },
    { path: '/integrations', icon: Zap, label: 'Integrations' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:relative w-64 h-screen bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 transition-transform duration-300 z-50 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <Lock size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white">SecureAI</span>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {links.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  location.pathname === path
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
