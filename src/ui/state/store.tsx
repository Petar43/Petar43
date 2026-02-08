import React, { createContext, useContext, useReducer } from 'react';
import { appReducer } from './reducer';
import { Action, AppState } from './types';

const initialState: AppState = {
  habits: [],
  completions: [],
  missions: [],
  profile: {
    id: 'player',
    level: 1,
    xp: 0,
    coins: 0,
    rank: 'Bronze',
    shieldsAvailable: 2,
    streak: 0,
    lastActiveDate: null,
    pityCounter: 0,
    skillPoints: 0
  },
  skills: {
    id: 'player',
    unlocked: []
  },
  inventory: [],
  settings: {
    id: 'settings',
    restDaysPerWeek: 1,
    prefersReducedMotion: false,
    highContrast: false
  },
  restDays: [],
  activeTab: 'dashboard'
};

const AppStateContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<React.Dispatch<Action>>(() => undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppStateContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}

export { initialState };
