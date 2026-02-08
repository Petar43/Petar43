import React from 'react';
import { AppState } from '../state/types';

const TABS: { id: AppState['activeTab']; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'habits', label: 'Habits' },
  { id: 'missions', label: 'Missions' },
  { id: 'skills', label: 'Skill Tree' },
  { id: 'rewards', label: 'Rewards' },
  { id: 'stats', label: 'Stats' },
  { id: 'settings', label: 'Settings' }
];

export function TabBar({ active, onChange }: { active: AppState['activeTab']; onChange: (tab: AppState['activeTab']) => void }) {
  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            active === tab.id
              ? 'bg-dream text-white shadow-md shadow-dream/40'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
