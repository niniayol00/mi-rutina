import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, AppSettings } from '../types';
import { defaultRoutine } from '../data/routineData';

const ROUTINE_KEY = 'mi_rutina_routine';
const SETTINGS_KEY = 'mi_rutina_settings';
const DATA_VERSION_KEY = 'mi_rutina_version';
const TRAINING_DATES_KEY = 'mi_rutina_training_dates';
const CURRENT_VERSION = '3';

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

export async function loadRoutine(): Promise<Routine> {
  try {
    const version = await AsyncStorage.getItem(DATA_VERSION_KEY);
    if (version !== CURRENT_VERSION) {
      await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(defaultRoutine));
      await AsyncStorage.setItem(DATA_VERSION_KEY, CURRENT_VERSION);
      return defaultRoutine;
    }
    const raw = await AsyncStorage.getItem(ROUTINE_KEY);
    if (raw) return JSON.parse(raw) as Routine;
    return defaultRoutine;
  } catch {
    return defaultRoutine;
  }
}

export async function saveRoutine(routine: Routine): Promise<void> {
  await AsyncStorage.setItem(ROUTINE_KEY, JSON.stringify(routine));
}

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

export async function checkAndResetIfNewDay(
  routine: Routine,
  settings: AppSettings
): Promise<{ routine: Routine; settings: AppSettings; wasReset: boolean }> {
  const today = new Date().toDateString();
  if (settings.dailyResetSeries && settings.lastResetDate !== today) {
    const resetRoutine = resetAllSeries(routine);
    const newSettings = { ...settings, lastResetDate: today };
    await saveRoutine(resetRoutine);
    await saveSettings(newSettings);
    return { routine: resetRoutine, settings: newSettings, wasReset: true };
  }
  return { routine, settings, wasReset: false };
}
