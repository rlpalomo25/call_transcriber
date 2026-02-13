
import React from 'react';
import { AppRoute } from '../types';

interface SidebarProps {
  currentRoute: AppRoute;
  setRoute: (route: AppRoute) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentRoute, setRoute }) => {
  const menuItems = [
    { id: AppRoute.DASHBOARD, icon: 'fa-chart-pie', label: 'Dashboard' },
    { id: AppRoute.CALENDAR, icon: 'fa-calendar-alt', label: 'Meetings' },
    { id: AppRoute.RECORDINGS, icon: 'fa-folder-open', label: 'Recordings' },
    { id: AppRoute.SETTINGS, icon: 'fa-cog', label: 'Settings' },
  ];

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col p-6 sticky top-0">
      <div className="flex items-center gap-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center">
          <i className="fas fa-wave-square text-white text-lg"></i>
        </div>
        <h1 className="text-xl font-bold tracking-tight">BobbyAi<span className="text-sky-400">.notes</span></h1>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setRoute(item.id)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
              currentRoute === item.id 
              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} text-lg w-6 ${currentRoute === item.id ? 'text-sky-400' : 'group-hover:text-sky-400 transition-colors'}`}></i>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800">
        <div className="flex items-center gap-3 p-2">
          <img src="https://picsum.photos/id/64/100/100" className="w-10 h-10 rounded-full border border-slate-700" alt="Avatar" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Alex Johnson</p>
            <p className="text-xs text-slate-500 truncate">Engineering Team</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
