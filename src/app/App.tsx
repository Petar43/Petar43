import React, { useEffect, useMemo, useState } from 'react';
import { AppProvider, useAppDispatch, useAppState, initialState } from '../ui/state/store';
import { TabBar } from '../ui/components/TabBar';
import { Section } from '../ui/components/Section';
import {
  loadCompletions,
  loadHabits,
  loadInventory,
  loadMissions,
  loadProfile,
  loadSettings,
  loadSkills,
  loadMeta,
  saveCompletion,
  saveHabit,
  saveInventory,
  saveMissions,
  saveProfile,
  saveSettings,
  saveSkills,
  saveMeta
} from '../data/repositories';
import { Completion, Habit, InventoryItem, PlayerProfile } from '../domain/types';
import { calculateRollingConsistency, updateStreakState } from '../domain/streak';
import { calculateXp, applyXpReward, rewardFromXp } from '../domain/xp';
import { createSeededRng } from '../domain/rng';
import { generateWeeklyMissions, updateMissionProgress } from '../domain/missions';
import { pointsEarnedByLevel } from '../domain/skills';
import { rollLoot } from '../domain/loot';
import { toDateKey, weekStart } from '../domain/time';
import { isHabitScheduledToday } from '../domain/schedule';

function AppInner() {
  const state = useAppState();
  const dispatch = useAppDispatch();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const hydrate = async () => {
      const [habits, completions, missions, profileList, skillsList, inventory, settingsList, meta] = await Promise.all([
        loadHabits(),
        loadCompletions(),
        loadMissions(),
        loadProfile(),
        loadSkills(),
        loadInventory(),
        loadSettings(),
        loadMeta()
      ]);
      const profile = profileList[0] ?? initialState.profile;
      const skills = skillsList[0] ?? initialState.skills;
      const settings = settingsList[0] ?? initialState.settings;
      const restMeta = meta.find((item) => item.key === 'restDays');
      const restDays = restMeta ? JSON.parse(restMeta.value) : [];
      const payload = {
        ...initialState,
        habits,
        completions,
        missions,
        profile,
        skills,
        inventory,
        settings,
        restDays
      };
      dispatch({ type: 'hydrate', payload });
      setHydrated(true);
    };
    hydrate();
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    const classList = document.documentElement.classList;
    if (state.settings.prefersReducedMotion) {
      classList.add('no-motion');
    } else {
      classList.remove('no-motion');
    }
    if (state.settings.highContrast) {
      classList.add('high-contrast');
    } else {
      classList.remove('high-contrast');
    }
  }, [hydrated, state.settings.prefersReducedMotion, state.settings.highContrast]);

  const today = useMemo(() => new Date(), []);
  const todayKey = toDateKey(today);

  const scheduledHabits = state.habits.filter(
    (habit) => habit.archivedAt === null && isHabitScheduledToday(habit.schedule, today)
  );

  const completionsToday = state.completions.filter((completion) => completion.date === todayKey);
  const completedHabitIds = new Set(completionsToday.map((completion) => completion.habitId));

  const rollingConsistency = calculateRollingConsistency(state.completions, todayKey);

  const handleCompleteQuest = async (habit: Habit, mode: 'full' | 'low_energy') => {
    if (completedHabitIds.has(habit.id)) {
      return;
    }
    const combo = Math.max(1, state.profile.streak + 1);
    const xp = calculateXp(habit.difficulty, habit.estimatedMinutes, rollingConsistency, combo, mode);
    const reward = rewardFromXp(xp);
    const completion: Completion = {
      id: `completion-${habit.id}-${todayKey}`,
      habitId: habit.id,
      date: todayKey,
      mode,
      createdAt: new Date().toISOString()
    };
    const updatedCompletions = [completion, ...state.completions];
    const streakState = updateStreakState(
      {
        streak: state.profile.streak,
        shieldsAvailable: state.profile.shieldsAvailable,
        shieldsUsed: 0,
        lastActiveDate: state.profile.lastActiveDate
      },
      updatedCompletions,
      todayKey,
      state.restDays,
      3
    );

    const xpState = applyXpReward(state.profile.xp, state.profile.level, reward.xp);
    const skillPoints = state.profile.skillPoints + pointsEarnedByLevel(xpState.levelUps);

    const rng = createSeededRng(Date.now());
    const lootResult = rollLoot(rng, state.profile.pityCounter);

    const updatedProfile: PlayerProfile = {
      ...state.profile,
      xp: xpState.xp,
      level: xpState.level,
      coins: state.profile.coins + reward.coins,
      streak: streakState.streak,
      shieldsAvailable: streakState.shieldsAvailable,
      lastActiveDate: todayKey,
      pityCounter: lootResult.pityCounter,
      skillPoints
    };

    const updatedMissions = updateMissionProgress(
      state.missions,
      habit.id,
      new Set(completionsToday.map((c) => state.habits.find((h) => h.id === c.habitId)?.category)).size,
      updatedProfile.streak
    );

    dispatch({ type: 'addCompletion', payload: completion });
    dispatch({ type: 'updateProfile', payload: updatedProfile });
    dispatch({ type: 'setMissions', payload: updatedMissions });

    if (lootResult.item) {
      const updatedInventory: InventoryItem[] = [lootResult.item, ...state.inventory];
      dispatch({ type: 'setInventory', payload: updatedInventory });
      await saveInventory(updatedInventory);
    }

    await Promise.all([
      saveCompletion(completion),
      saveProfile(updatedProfile),
      saveMissions(updatedMissions)
    ]);
  };

  const handleAddHabit = async (habit: Habit) => {
    dispatch({ type: 'addHabit', payload: habit });
    await saveHabit(habit);
  };

  const handleUpdateSettings = async (settings: typeof state.settings) => {
    dispatch({ type: 'updateSettings', payload: settings });
    await saveSettings(settings);
  };

  const handleRestDays = async (restDays: string[]) => {
    dispatch({ type: 'setRestDays', payload: restDays });
    await saveMeta({ key: 'restDays', value: JSON.stringify(restDays) });
  };

  const handleGenerateMissions = async () => {
    const rng = createSeededRng(Date.now());
    const missions = generateWeeklyMissions(state.habits, rng, today);
    dispatch({ type: 'setMissions', payload: missions });
    await saveMissions(missions);
  };

  const handleExport = () => {
    const payload = {
      version: 1,
      data: state
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `habit-quest-backup-${todayKey}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File) => {
    const text = await file.text();
    const payload = JSON.parse(text) as { version: number; data: typeof state };
    if (payload.version !== 1) {
      alert('Unsupported backup version.');
      return;
    }
    const data = payload.data;
    dispatch({ type: 'hydrate', payload: data });
    await Promise.all([
      saveMissions(data.missions),
      saveProfile(data.profile),
      saveSkills([data.skills]),
      saveInventory(data.inventory),
      saveSettings(data.settings)
    ]);
    await Promise.all(data.habits.map((habit) => saveHabit(habit)));
    await Promise.all(data.completions.map((completion) => saveCompletion(completion)));
    await saveMeta({ key: 'restDays', value: JSON.stringify(data.restDays) });
  };

  const handleDemoData = async () => {
    const response = await fetch('/demo-seed.json');
    const data = (await response.json()) as { habits: Habit[]; completions: Completion[] };
    const updatedHabits = [...data.habits];
    const updatedCompletions = [...data.completions];
    const rng = createSeededRng(1234);
    const missions = generateWeeklyMissions(updatedHabits, rng, today);
    const profile = { ...state.profile, xp: 250, coins: 80, level: 3, rank: 'Silver' };

    dispatch({
      type: 'hydrate',
      payload: {
        ...state,
        habits: updatedHabits,
        completions: updatedCompletions,
        missions,
        profile
      }
    });

    await Promise.all([
      saveMissions(missions),
      saveProfile(profile),
      Promise.all(updatedHabits.map((habit) => saveHabit(habit))),
      Promise.all(updatedCompletions.map((completion) => saveCompletion(completion)))
    ]);
  };

  if (!hydrated) {
    return <div className="p-8 text-slate-200">Loading your quest log...</div>;
  }

  return (
    <div className="min-h-screen bg-ink px-6 pb-16 pt-10">
      <header className="mx-auto mb-8 flex max-w-6xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm uppercase tracking-[0.3em] text-glow">Habit Quest</p>
          <h1 className="text-3xl font-semibold text-white">Your RPG-style habit companion</h1>
          <p className="text-slate-300">
            No worries—use a shield or switch to low-energy mode today.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-2xl bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">Level</p>
            <p className="text-lg font-semibold">{state.profile.level}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">Rank</p>
            <p className="text-lg font-semibold">{state.profile.rank}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">Coins</p>
            <p className="text-lg font-semibold">{state.profile.coins}</p>
          </div>
          <div className="rounded-2xl bg-slate-900/70 px-4 py-3">
            <p className="text-xs uppercase text-slate-400">Shields</p>
            <p className="text-lg font-semibold">{state.profile.shieldsAvailable}</p>
          </div>
        </div>
        <TabBar active={state.activeTab} onChange={(tab) => dispatch({ type: 'setTab', payload: tab })} />
      </header>

      <main className="mx-auto grid max-w-6xl gap-6">
        {state.activeTab === 'dashboard' && (
          <div className="grid gap-6 lg:grid-cols-2">
            <Section title="Today's Quests">
              <div className="space-y-3">
                {scheduledHabits.length === 0 && (
                  <p className="text-slate-400">No quests scheduled. Add a habit to get started.</p>
                )}
                {scheduledHabits.map((habit) => (
                  <div key={habit.id} className="flex items-center justify-between rounded-xl bg-slate-900/60 p-4">
                    <div>
                      <p className="font-semibold">{habit.name}</p>
                      <p className="text-sm text-slate-400">{habit.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="rounded-full bg-glow px-4 py-2 text-sm font-semibold text-slate-900"
                        onClick={() => handleCompleteQuest(habit, 'full')}
                        disabled={completedHabitIds.has(habit.id)}
                      >
                        Complete
                      </button>
                      <button
                        className="rounded-full border border-slate-600 px-4 py-2 text-sm"
                        onClick={() => handleCompleteQuest(habit, 'low_energy')}
                        disabled={completedHabitIds.has(habit.id)}
                      >
                        Low-energy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Momentum">
              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase text-slate-400">7-day consistency</p>
                  <p className="text-2xl font-semibold">{Math.round(rollingConsistency * 100)}%</p>
                </div>
                <div>
                  <p className="text-sm uppercase text-slate-400">Streak</p>
                  <p className="text-2xl font-semibold">{state.profile.streak} days</p>
                </div>
                <div>
                  <p className="text-sm uppercase text-slate-400">Active missions</p>
                  <p className="text-2xl font-semibold">{state.missions.filter((mission) => !mission.completed).length}</p>
                </div>
                <button
                  className="rounded-full bg-slate-800 px-4 py-2 text-sm"
                  onClick={handleGenerateMissions}
                >
                  Regenerate weekly missions
                </button>
              </div>
            </Section>
          </div>
        )}

        {state.activeTab === 'habits' && (
          <HabitsPage onAddHabit={handleAddHabit} />
        )}

        {state.activeTab === 'missions' && (
          <MissionsPage missions={state.missions} />
        )}

        {state.activeTab === 'skills' && (
          <SkillsPage skillPoints={state.profile.skillPoints} unlocked={state.skills.unlocked} />
        )}

        {state.activeTab === 'rewards' && (
          <RewardsPage inventory={state.inventory} />
        )}

        {state.activeTab === 'stats' && (
          <StatsPage completions={state.completions} todayKey={todayKey} />
        )}

        {state.activeTab === 'settings' && (
          <SettingsPage
            settings={state.settings}
            restDays={state.restDays}
            onUpdateSettings={handleUpdateSettings}
            onUpdateRestDays={handleRestDays}
            onExport={handleExport}
            onImport={handleImport}
            onLoadDemo={handleDemoData}
          />
        )}
      </main>
      <footer className="mx-auto mt-10 max-w-6xl text-sm text-slate-500">
        Week starts on {weekStart(today)} · Shields reset weekly and max out at 3.
      </footer>
    </div>
  );
}

function HabitsPage({ onAddHabit }: { onAddHabit: (habit: Habit) => void }) {
  const state = useAppState();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState(3);
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);
  const [category, setCategory] = useState<'Mind' | 'Strength' | 'Focus' | 'Health' | 'Social' | 'Craft'>('Mind');

  const handleSubmit = () => {
    if (!name.trim()) {
      return;
    }
    const habit: Habit = {
      id: `habit-${Date.now()}`,
      name,
      description,
      difficulty,
      estimatedMinutes,
      category,
      schedule: { type: 'daily' },
      lowEnergyMinimum: null,
      createdAt: new Date().toISOString(),
      archivedAt: null
    };
    onAddHabit(habit);
    setName('');
    setDescription('');
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Section title="Create a new habit">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg bg-slate-900/60 p-2"
            placeholder="Habit name"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <textarea
            className="w-full rounded-lg bg-slate-900/60 p-2"
            placeholder="Description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <div className="flex gap-3">
            <label className="flex flex-col text-sm text-slate-400">
              Difficulty
              <input
                type="number"
                min={1}
                max={5}
                className="rounded-lg bg-slate-900/60 p-2"
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
              />
            </label>
            <label className="flex flex-col text-sm text-slate-400">
              Minutes
              <input
                type="number"
                min={5}
                max={60}
                className="rounded-lg bg-slate-900/60 p-2"
                value={estimatedMinutes}
                onChange={(event) => setEstimatedMinutes(Number(event.target.value))}
              />
            </label>
          </div>
          <label className="flex flex-col text-sm text-slate-400">
            Category
            <select
              className="rounded-lg bg-slate-900/60 p-2"
              value={category}
              onChange={(event) => setCategory(event.target.value as Habit['category'])}
            >
              {['Mind', 'Strength', 'Focus', 'Health', 'Social', 'Craft'].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <button className="rounded-full bg-dream px-4 py-2 text-sm" onClick={handleSubmit}>
            Add Habit
          </button>
        </div>
      </Section>
      <Section title="Active habits">
        <div className="space-y-3">
          {state.habits.length === 0 && (
            <p className="text-slate-400">No habits yet. Add one to start tracking.</p>
          )}
          {state.habits.map((habit) => (
            <div key={habit.id} className="rounded-xl bg-slate-900/60 p-4">
              <p className="font-semibold">{habit.name}</p>
              <p className="text-sm text-slate-400">{habit.description}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function MissionsPage({ missions }: { missions: typeof initialState.missions }) {
  return (
    <Section title="Weekly Missions">
      <div className="space-y-3">
        {missions.length === 0 && (
          <p className="text-slate-400">Generate missions to see weekly objectives.</p>
        )}
        {missions.map((mission) => (
          <div key={mission.id} className="rounded-xl bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{mission.description}</p>
              <span className={`text-sm ${mission.completed ? 'text-glow' : 'text-slate-400'}`}>
                {mission.progress}/{mission.target}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SkillsPage({ skillPoints, unlocked }: { skillPoints: number; unlocked: string[] }) {
  const skills = [
    { id: 'focus', name: 'Focus', perk: 'Bonus XP on mind habits' },
    { id: 'strength', name: 'Strength', perk: 'Combo bonus multiplier' },
    { id: 'mind', name: 'Mind', perk: 'Weekly mission bonus' }
  ];
  return (
    <Section title="Skill Tree">
      <div className="space-y-3">
        <p className="text-sm text-slate-400">Skill points available: {skillPoints}</p>
        {skills.map((skill) => (
          <div key={skill.id} className="rounded-xl bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="font-semibold">{skill.name}</p>
              <span className="text-xs text-slate-400">
                {unlocked.includes(skill.id) ? 'Unlocked' : 'Locked'}
              </span>
            </div>
            <p className="text-sm text-slate-400">{skill.perk}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function RewardsPage({ inventory }: { inventory: InventoryItem[] }) {
  return (
    <Section title="Rewards & Cosmetics">
      <div className="grid gap-3 md:grid-cols-2">
        {inventory.length === 0 && (
          <p className="text-slate-400">Complete quests to unlock your first cosmetics.</p>
        )}
        {inventory.map((item) => (
          <div key={item.id} className="rounded-xl bg-slate-900/60 p-4">
            <p className="font-semibold">{item.name}</p>
            <p className="text-sm text-slate-400">{item.rarity}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

function StatsPage({ completions, todayKey }: { completions: Completion[]; todayKey: string }) {
  const rollingConsistency = calculateRollingConsistency(completions, todayKey);
  return (
    <Section title="Stats">
      <div className="space-y-3">
        <p className="text-slate-400">7-day rolling consistency</p>
        <p className="text-2xl font-semibold">{Math.round(rollingConsistency * 100)}%</p>
        <p className="text-sm text-slate-500">Completions logged: {completions.length}</p>
      </div>
    </Section>
  );
}

function SettingsPage({
  settings,
  restDays,
  onUpdateSettings,
  onUpdateRestDays,
  onExport,
  onImport,
  onLoadDemo
}: {
  settings: typeof initialState.settings;
  restDays: string[];
  onUpdateSettings: (settings: typeof initialState.settings) => void;
  onUpdateRestDays: (restDays: string[]) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onLoadDemo: () => void;
}) {
  const [restDayInput, setRestDayInput] = useState('');
  const fileInputId = 'import-backup';

  return (
    <Section title="Settings & Backup">
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.prefersReducedMotion}
            onChange={(event) =>
              onUpdateSettings({ ...settings, prefersReducedMotion: event.target.checked })
            }
          />
          Prefers reduced motion
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={settings.highContrast}
            onChange={(event) => onUpdateSettings({ ...settings, highContrast: event.target.checked })}
          />
          High contrast mode
        </label>

        <div className="space-y-2">
          <p className="text-sm text-slate-300">Plan rest days (yyyy-mm-dd)</p>
          <div className="flex gap-2">
            <input
              className="rounded-lg bg-slate-900/60 p-2"
              placeholder="2024-06-20"
              value={restDayInput}
              onChange={(event) => setRestDayInput(event.target.value)}
            />
            <button
              className="rounded-full bg-slate-800 px-3 py-2 text-sm"
              onClick={() => {
                if (!restDayInput) return;
                onUpdateRestDays([...restDays, restDayInput]);
                setRestDayInput('');
              }}
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {restDays.map((day) => (
              <span key={day} className="rounded-full bg-slate-800 px-3 py-1 text-xs">
                {day}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-full bg-glow px-4 py-2 text-sm text-slate-900" onClick={onExport}>
            Export backup
          </button>
          <label className="rounded-full border border-slate-600 px-4 py-2 text-sm">
            Import backup
            <input
              id={fileInputId}
              type="file"
              className="hidden"
              accept="application/json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onImport(file);
                }
              }}
            />
          </label>
          <button className="rounded-full bg-dream px-4 py-2 text-sm" onClick={onLoadDemo}>
            Load demo data
          </button>
        </div>
      </div>
    </Section>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
