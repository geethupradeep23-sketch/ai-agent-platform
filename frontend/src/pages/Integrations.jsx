import React from 'react';

const Integrations = () => {
  const integrations = [
    { name: 'WhatsApp', description: 'Connect your WhatsApp account', icon: '💬' },
    { name: 'Email', description: 'Sync your emails', icon: '📧' },
    { name: 'Telegram', description: 'Connect Telegram bot', icon: '✈️' },
    { name: 'Slack', description: 'Integrate with Slack', icon: '💼' },
  ];

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Integrations</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {integrations.map((int, idx) => (
          <div key={idx} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500 transition">
            <div className="text-4xl mb-3">{int.icon}</div>
            <h3 className="text-lg font-bold text-white mb-2">{int.name}</h3>
            <p className="text-slate-400 text-sm mb-4">{int.description}</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
              Connect
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integrations;
