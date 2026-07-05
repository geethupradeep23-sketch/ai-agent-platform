import React from 'react';

const Agents = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-8">AI Agents</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500 transition cursor-pointer group">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 mb-4 group-hover:scale-110 transition"></div>
            <h3 className="text-lg font-bold text-white mb-2">Agent {i}</h3>
            <p className="text-slate-400 text-sm mb-4">Specialized AI assistant for specific tasks</p>
            <button className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium">
              Configure
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Agents;
