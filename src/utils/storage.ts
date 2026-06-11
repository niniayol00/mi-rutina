import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, AppSettings, WorkoutSession, ProgressData, ExerciseLog, ExerciseLogEntry } from '../types';
import { defaultRoutine } from '../data/routineData';

const SETTINGS_KEY = 'mi_rutina_settings';
const TRAINING_DATES_KEY = 'mi_rutina_training_dates';
const SESSIONS_KEY = 'mi_rutina_sessions';
const PROGRESS_KEY = 'mi_rutina_progress';
const ALL_ROUTINES_KEY = 'mi_rutina_all_v3';
const ACTIVE_ID_KEY = 'mi_rutina_active_id';
const WELCOME_DATE_KEY = 'mi_rutina_welcome_date';
const SESSION_START_KEY = 'mi_rutina_session_start';
const ONBOARDED_KEY = 'mi_rutina_onboarded';

export const defaultSettings: AppSettings = {
  userName: '',
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

export async function deleteRoutine(id: string): Promise<Record<string, Routine>> {
  const all = await loadAllRoutines();
  delete all[id];
  await saveAllRoutines(all);
  const activeId = await loadActiveRoutineId();
  if (activeId === id) {
    const firstId = Object.keys(all)[0];
    if (firstId) await saveActiveRoutineId(firstId);
  }
  return all;
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
    await clearSessionStart();
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

export function calcStreak(trainingDates: string[]): number {
  if (trainingDates.length === 0) return 0;
  const sorted = [...trainingDates].sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let cursor = new Date(today);
  for (const d of sorted) {
    const date = new Date(d);
    date.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor.getTime() - date.getTime()) / 86400000);
    if (diff === 0) { streak++; cursor.setDate(cursor.getDate() - 1); }
    else if (diff === 1) { streak++; cursor = new Date(date); cursor.setDate(cursor.getDate() - 1); }
    else break;
  }
  return streak;
}

export async function shouldShowWelcomeToday(): Promise<boolean> {
  try {
    const last = await AsyncStorage.getItem(WELCOME_DATE_KEY);
    const today = new Date().toDateString();
    if (last === today) return false;
    await AsyncStorage.setItem(WELCOME_DATE_KEY, today);
    return true;
  } catch {
    return true;
  }
}

export async function saveProgress(progress: ProgressData): Promise<void> {
  await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

// ─── Weight History ───────────────────────────────────────────────

const WEIGHT_HISTORY_KEY = 'mi_rutina_weight_history';

export async function loadWeightHistory(): Promise<Record<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(WEIGHT_HISTORY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function saveWeightHistory(history: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(history));
}

export async function updateWeightForExercise(exerciseName: string, weight: string): Promise<void> {
  const history = await loadWeightHistory();
  history[exerciseName.toLowerCase().trim()] = weight;
  await saveWeightHistory(history);
}

// ─── Exercise Log (historial por ejercicio) ───────────────────────

const EXERCISE_LOG_KEY = 'mi_rutina_exercise_log';
const MAX_LOG_ENTRIES = 20;

export async function loadExerciseLog(): Promise<ExerciseLog> {
  try {
    const raw = await AsyncStorage.getItem(EXERCISE_LOG_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export async function saveExerciseLog(log: ExerciseLog): Promise<void> {
  await AsyncStorage.setItem(EXERCISE_LOG_KEY, JSON.stringify(log));
}

function parseWeightKg(weight: string): number {
  const n = parseFloat(weight.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

export function getMaxWeight(entries: ExerciseLogEntry[]): number {
  return entries.reduce((max, e) => Math.max(max, parseWeightKg(e.weight)), 0);
}

/**
 * Registra las entradas de la sesión completada en el log por ejercicio
 * y devuelve los nombres de ejercicios con nuevo récord personal de peso.
 */
export async function logCompletedWorkout(routine: Routine, date: string): Promise<string[]> {
  const log = await loadExerciseLog();
  const newRecords: string[] = [];

  routine.sections.forEach((section) => {
    section.exercises.forEach((ex) => {
      const key = ex.name.toLowerCase().trim();
      const prev = log[key] ?? [];
      const weightKg = ex.weight ? parseWeightKg(ex.weight) : 0;
      if (weightKg > 0 && prev.length > 0 && weightKg > getMaxWeight(prev)) {
        newRecords.push(ex.name);
      }
      const entry: ExerciseLogEntry = {
        date,
        weight: ex.weight ?? '',
        series: ex.series,
        reps: ex.reps,
      };
      log[key] = [entry, ...prev].slice(0, MAX_LOG_ENTRIES);
    });
  });

  await saveExerciseLog(log);
  return newRecords;
}

// ─── Onboarding ───────────────────────────────────────────────────

/**
 * Devuelve true solo en el primer arranque (sin nombre guardado).
 * A los usuarios existentes (que ya tienen nombre) los marca como
 * onboardeados en silencio para no molestarlos.
 */
export async function needsOnboarding(): Promise<boolean> {
  try {
    const flag = await AsyncStorage.getItem(ONBOARDED_KEY);
    if (flag === 'true') return false;
    const rawSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (rawSettings) {
      const s = JSON.parse(rawSettings);
      if (s.userName && String(s.userName).trim()) {
        await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export async function completeOnboarding(name: string): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({ ...settings, userName: name.trim() });
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

// ─── Respaldo (exportar / importar) ───────────────────────────────

/** Junta todos los datos guardados en un objeto plano (clave → valor). */
export async function exportAllData(): Promise<Record<string, unknown>> {
  const keys = await AsyncStorage.getAllKeys();
  const pairs = await AsyncStorage.multiGet(keys);
  const data: Record<string, unknown> = {};
  pairs.forEach(([k, v]) => {
    try { data[k] = v ? JSON.parse(v) : null; } catch { data[k] = v; }
  });
  return data;
}

/** Reemplaza todos los datos actuales por los del respaldo. */
export async function restoreAllData(data: Record<string, unknown>): Promise<void> {
  await AsyncStorage.clear();
  const entries: [string, string][] = Object.entries(data)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]);
  if (entries.length > 0) await AsyncStorage.multiSet(entries);
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

// ─── Session Start Time ───────────────────────────────────────────

export async function loadSessionStart(): Promise<Date | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_START_KEY);
    return raw ? new Date(raw) : null;
  } catch { return null; }
}

export async function saveSessionStart(date: Date): Promise<void> {
  await AsyncStorage.setItem(SESSION_START_KEY, date.toISOString());
}

export async function clearSessionStart(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_START_KEY);
}
