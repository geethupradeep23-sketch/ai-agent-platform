import React from 'react';
import { Plus, Zap, Settings, MessageSquare } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const stats = [
    { icon: Zap, label: 'Active Agents', value: '5', color: 'from-blue-500 to-blue-600' },
    { icon: MessageSquare, label: 'Messages Today', value: '127', color: 'from-purple-500 to-purple-600' },
    { icon: Settings, label: 'Integrations', value: '3', color: 'from-green-500 to-green-600' },
  ];

  const chartData = [
    { name: 'Mon', messages: 45 },
    { name: 'Tue', messages: 52 },
    { name: 'Wed', messages: 38 },
    { name: 'Thu', messages: 61 },
    { name: 'Fri', messages: 55 },
    { name: 'Sat', messages: 48 },
    { name: 'Sun', messages: 42 },
  ];

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Welcome back! Here's what's happening with your AI agents.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition">
          <Plus size={20} /> New Agent
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition group cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition`}>
                <Icon size={24} className="text-white" />
              </div>
              <p className="text-slate-400 text-sm font-medium mb-2">{stat.label}</p>
              <p className="text-3xl font-bold text-white">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Messages This Week</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Bar dataKey="messages" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
