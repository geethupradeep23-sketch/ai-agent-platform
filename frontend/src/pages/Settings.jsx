import React from 'react';

const Settings = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Email Notifications</label>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Two-Factor Authentication</label>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
              Enable 2FA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
