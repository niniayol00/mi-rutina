import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, AppSettings, WorkoutSession, ProgressData } from '../types';
import { defaultRoutine } from '../data/routineData';

const SETTINGS_KEY = 'mi_rutina_settings';
const TRAINING_DATES_KEY = 'mi_rutina_training_dates';
const SESSIONS_KEY = 'mi_rutina_sessions';
const PROGRESS_KEY = 'mi_rutina_progress';
const ALL_ROUTINES_KEY = 'mi_rutina_all_v2';
const ACTIVE_ID_KEY = 'mi_rutina_active_id';

export const defaultSettings: AppSettings = {
  autoStartTimerOnCheck: true,
  dailyResetSeries: true,
  voiceInputEnabled: true,
  quickTimeButtons: [30, 40, 45, 60, 90],
  vibrationOnCheck: true,
  vibrationOnFinish: true,
  soundOnFinish: true,
  editableFields: true,
  lastResetDate: new Date().toDateString(),
};

export const defaultProgress: ProgressData = {
  totalWorkouts: 0,
  totalSeries: 0,
  totalWeight: 0,
  totalMinutes: 0,
  lastWorkoutDate: null,
};

// ─── Multi-routine ───────────────────────────────────────────────

export async function loadAllRoutines(): Promise<Record<string, Routine>> {
  try {
    const raw = await AsyncStorage.getItem(ALL_ROUTINES_KEY);
    if (raw) return JSON.parse(raw);
    const seed: Record<string, Routine> = { [defaultRoutine.id]: defaultRoutine };
    await AsyncStorage.setItem(ALL_ROUTINES_KEY, JSON.stringify(seed));
    return seed;
  } catch {
    return { [defaultRoutine.id]: defaultRoutine };
  }
}

export async function saveAllRoutines(routines: Record<string, Routine>): Promise<void> {
  await AsyncStorage.setItem(ALL_ROUTINES_KEY, JSON.stringify(routines));
}

export async function loadActiveRoutineId(): Promise<string> {
  try {
    const id = await AsyncStorage.getItem(ACTIVE_ID_KEY);
    return id || defaultRoutine.id;
  } catch {
    return defaultRoutine.id;
  }
}

export async function saveActiveRoutineId(id: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_ID_KEY, id);
}

export async function addOrUpdateRoutine(routine: Routine): Promise<void> {
  const all = await loadAllRoutines();
  all[routine.id] = routine;
  await saveAllRoutines(all);
}

export async function loadActiveRoutine(): Promise<Routine> {
  const [all, activeId] = await Promise.all([loadAllRoutines(), loadActiveRoutineId()]);
  return all[activeId] ?? Object.values(all)[0] ?? defaultRoutine;
}

export async function saveActiveRoutine(routine: Routine): Promise<void> {
  const all = await loadAllRoutines();
  all[routine.id] = routine;
  await saveAllRoutines(all);
}

// ─── Helpers ─────────────────────────────────────────────────────

export function resetAllSeries(routine: Routine): Routine {
  return {
    ...routine,
    sections: routine.sections.map((section) => ({
      ...section,
      exercises: section.exercises.map((ex) => ({
        ...ex,
        seriesCompleted: ex.seriesCompleted.map(() => false),
      })),
    })),
  };
}

// ─── Settings ────────────────────────────────────────────────────

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
    return defaultSettings;
  } catch {
    return defaultSettings;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function checkAndResetIfNewDay(
  routine: Routine,
  settings: AppSettings
): Promise<{ routine: Routine; settings: AppSettings }> {
  const today = new Date().toDateString();
  if (settings.dailyResetSeries && settings.lastResetDate !== today) {
    const resetRoutine = resetAllSeries(routine);
    const newSettings = { ...settings, lastResetDate: today };
    await saveActiveRoutine(resetRoutine);
    await saveSettings(newSettings);
    return { routine: resetRoutine, settings: newSettings };
  }
  return { routine, settings };
}

// ─── Tracking ────────────────────────────────────────────────────

export async function loadTrainingDates(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(TRAINING_DATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveTrainingDate(dateStr: string): Promise<string[]> {
  const dates = await loadTrainingDates();
  if (!dates.includes(dateStr)) {
    const updated = [...dates, dateStr];
    await AsyncStorage.setItem(TRAINING_DATES_KEY, JSON.stringify(updated));
    return updated;
  }
  return dates;
}

export async function loadSessions(): Promise<WorkoutSession[]> {
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveSession(session: WorkoutSession): Promise<void> {
  const sessions = await loadSessions();
  const updated = [session, ...sessions].slice(0, 365);
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
}

export async function loadProgress(): Promise<ProgressData> {
  try {
    const raw = await AsyncStorage.getItem(PROGRESS_KEY);
    return raw ? { ...defaultProgress, ...JSON.parse(raw) } : defaultProgress;
  } catch {
    return defaultProgress;
  }
}

export async function saveProgress(progress: ProgressData): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}
