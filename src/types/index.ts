export type RoutineCategory =
  | 'Piernas'
  | 'Cardio'
  | 'Tren Superior'
  | 'Full Body'
  | 'Movilidad'
  | 'Personalizada';

export interface Routine {
  id: string;
  name: string;
  frequency: string;
  startDate: string;
  renewDate: string;
  category?: RoutineCategory;
  timesCompleted?: number;
  lastRunDate?: string;
  sections: Section[];
}

export interface Section {
  name: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  series: number;
  reps: string;
  weight?: string;
  restSeconds: number;
  workSeconds?: number;
  seriesCompleted: boolean[];
  editable?: boolean;
}

export interface AppSettings {
  autoStartTimerOnCheck: boolean;
  dailyResetSeries: boolean;
  voiceInputEnabled: boolean;
  quickTimeButtons: number[];
  vibrationOnCheck: boolean;
  vibrationOnFinish: boolean;
  soundOnFinish: boolean;
  editableFields: boolean;
  lastResetDate: string;
}

export interface WorkoutSession {
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  totalSeries: number;
  totalWeight: number;
  routineName: string;
}

export interface ProgressData {
  totalWorkouts: number;
  totalSeries: number;
  totalWeight: number;
  totalMinutes: number;
  lastWorkoutDate: string | null;
}

export interface ExerciseLogEntry {
  date: string;
  weight: string;
  series: number;
  reps: string;
}

export type ExerciseLog = Record<string, ExerciseLogEntry[]>;
