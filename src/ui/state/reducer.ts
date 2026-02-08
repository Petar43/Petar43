import { Action, AppState } from './types';

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.payload;
    case 'setTab':
      return { ...state, activeTab: action.payload };
    case 'addHabit':
      return { ...state, habits: [...state.habits, action.payload] };
    case 'updateHabit':
      return {
        ...state,
        habits: state.habits.map((habit) =>
          habit.id === action.payload.id ? action.payload : habit
        )
      };
    case 'addCompletion':
      return { ...state, completions: [...state.completions, action.payload] };
    case 'setMissions':
      return { ...state, missions: action.payload };
    case 'updateProfile':
      return { ...state, profile: action.payload };
    case 'setSkills':
      return { ...state, skills: action.payload };
    case 'setInventory':
      return { ...state, inventory: action.payload };
    case 'updateSettings':
      return { ...state, settings: action.payload };
    case 'setRestDays':
      return { ...state, restDays: action.payload };
    default:
      return state;
  }
}
