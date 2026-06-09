import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Routine, AppSettings, Exercise, WorkoutSession } from '../types';
import {
  loadAllRoutines, saveAllRoutines, loadActiveRoutineId, saveActiveRoutineId,
  saveActiveRoutine, loadSettings, saveSettings, checkAndResetIfNewDay,
  loadTrainingDates, saveTrainingDate, loadProgress, saveProgress,
  saveSession, resetAllSeries, loadWeightHistory, updateWeightForExercise,
  shouldShowWelcomeToday, loadSessionStart, saveSessionStart, clearSessionStart,
} from '../utils/storage';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export function useRoutineSession() {
  const [allRoutines, setAllRoutines] = useState<Record<string, Routine>>({});
  const [activeId, setActiveId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [weightHistory, setWeightHistory] = useState<Record<string, string>>({});
  const [trainingDates, setTrainingDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<string>('');

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedShown = useRef(false);
  const firstCheckDone = useRef(false);
  const sessionStart = useRef(new Date());

  const routine = allRoutines[activeId] ?? null;

  // ─── Load ─────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const [all, activeIdRaw, s, dates, wh, savedStart] = await Promise.all([
      loadAllRoutines(), loadActiveRoutineId(), loadSettings(),
      loadTrainingDates(), loadWeightHistory(), loadSessionStart(),
    ]);
    const currentId = (all[activeIdRaw] ? activeIdRaw : Object.keys(all)[0]) ?? '';
    const current = all[currentId];
    let finalAll = all;
    let finalSettings = s;
    if (current) {
      const { routine: checked, settings: cs } = await checkAndResetIfNewDay(current, s);
      finalAll = { ...all, [currentId]: checked };
      finalSettings = cs;
    }
    const active = finalAll[currentId];
    if (active) {
      const allDone = active.sections.every((sec) =>
        sec.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
      );
      if (allDone && active.sections.some((s) => s.exercises.length > 0)) {
        const clean = resetAllSeries(active);
        finalAll = { ...finalAll, [currentId]: clean };
        await saveAllRoutines(finalAll);
        await clearSessionStart();
      }
    }
    setAllRoutines(finalAll);
    setActiveId(currentId);
    setSettings(finalSettings);
    setTrainingDates(dates);
    setWeightHistory(wh);
    completedShown.current = false;
    firstCheckDone.current = false;

    // Restaurar sessionStart desde storage o crear uno nuevo
    if (savedStart) {
      sessionStart.current = savedStart;
      const h = String(savedStart.getHours()).padStart(2, '0');
      const m = String(savedStart.getMinutes()).padStart(2, '0');
      setArrivalTime(`${h}:${m}`);
    } else {
      sessionStart.current = new Date();
      setArrivalTime(null);
    }

    setDepartureTime(null);
    setWorkoutDuration('');
    const showW = await shouldShowWelcomeToday();
    setShowWelcome(showW);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ─── Persist ──────────────────────────────────────────────────────

  const persistRoutine = (updated: Routine) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveActiveRoutine(updated), 400);
  };

  const updateAllRoutines = (updated: Routine) => {
    const newAll = { ...allRoutines, [updated.id]: updated };
    setAllRoutines(newAll);
    persistRoutine(updated);
  };

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // ─── Completion ───────────────────────────────────────────────────

  const checkAllCompleted = useCallback(async (updated: Routine) => {
    if (completedShown.current) return;
    const allDone = updated.sections.every((s) =>
      s.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
    );
    if (!allDone) return;
    completedShown.current = true;

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - sessionStart.current.getTime()) / 60000);
    let totalSeries = 0, totalWeight = 0;
    updated.sections.forEach((s) => s.exercises.forEach((ex) => {
      totalSeries += ex.series;
      if (ex.weight) { const kg = parseFloat(ex.weight); if (!isNaN(kg)) totalWeight += kg * ex.series; }
    }));

    const today = getToday();
    const session: WorkoutSession = {
      date: today, startTime: sessionStart.current.toISOString(),
      endTime: endTime.toISOString(), durationMinutes,
      totalSeries, totalWeight, routineName: updated.name,
    };
    await saveSession(session);
    const progress = await loadProgress();
    await saveProgress({
      totalWorkouts: progress.totalWorkouts + 1,
      totalSeries: progress.totalSeries + totalSeries,
      totalWeight: progress.totalWeight + totalWeight,
      totalMinutes: progress.totalMinutes + durationMinutes,
      lastWorkoutDate: today,
    });
    const updatedDates = await saveTrainingDate(today);
    setTrainingDates(updatedDates);

    const depH = String(endTime.getHours()).padStart(2, '0');
    const depM = String(endTime.getMinutes()).padStart(2, '0');
    setDepartureTime(`${depH}:${depM}`);
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    setWorkoutDuration(hours > 0
      ? `${hours}h ${mins > 0 ? `${mins}min` : ''}`.trim()
      : `${mins} minuto${mins !== 1 ? 's' : ''}`
    );
  }, []);

  // ─── Exercise actions ─────────────────────────────────────────────

  const toggleSeries = async (sectionIdx: number, exerciseIdx: number, seriesIdx: number) => {
    if (!routine) return;

    // Verificar si es el primer tilde marcado
    const isFirstCheck = !arrivalTime && routine.sections.every((s) =>
      s.exercises.every((ex) => ex.seriesCompleted.every((c) => !c))
    );

    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return {
          ...section,
          exercises: section.exercises.map((ex, ei) => {
            if (ei !== exerciseIdx) return ex;
            const newCompleted = [...ex.seriesCompleted];
            newCompleted[seriesIdx] = !newCompleted[seriesIdx];
            return { ...ex, seriesCompleted: newCompleted };
          }),
        };
      }),
    };

    // Si es el primer tilde y se está marcando (no desmarcando), registrar hora de entrada
    if (isFirstCheck && updated.sections[sectionIdx].exercises[exerciseIdx].seriesCompleted[seriesIdx]) {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      setArrivalTime(`${h}:${m}`);
      sessionStart.current = now;
      await saveSessionStart(now);
    }

    updateAllRoutines(updated);
    checkAllCompleted(updated);
  };

  const editExerciseField = (sectionIdx: number, exerciseIdx: number, field: string, value: string) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return {
          ...section,
          exercises: section.exercises.map((ex, ei) => {
            if (ei !== exerciseIdx) return ex;
            if (field === 'seriesCompleted') return { ...ex, seriesCompleted: JSON.parse(value) };
            if (field === 'series') return { ...ex, series: parseInt(value) || 1 };
            if (field === 'restSeconds') return { ...ex, restSeconds: parseInt(value) || 0 };
            return { ...ex, [field]: value };
          }),
        };
      }),
    };
    updateAllRoutines(updated);
  };

  const saveExercise = (sectionIdx: number, exerciseIdx: number, updated: Exercise) => {
    if (!routine) return;
    const updatedRoutine: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return { ...section, exercises: section.exercises.map((ex, ei) => ei === exerciseIdx ? updated : ex) };
      }),
    };
    // Persist weight history
    if (updated.weight) {
      updateWeightForExercise(updated.name, updated.weight);
      setWeightHistory((prev) => ({ ...prev, [updated.name.toLowerCase().trim()]: updated.weight! }));
    }
    updateAllRoutines(updatedRoutine);
  };

  const duplicateExercise = (sectionIdx: number, exerciseIdx: number) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        const exercises = [...section.exercises];
        const original = exercises[exerciseIdx];
        exercises.splice(exerciseIdx + 1, 0, {
          ...original, id: generateId(),
          name: `${original.name} (copia)`,
          seriesCompleted: Array(original.series).fill(false),
        });
        return { ...section, exercises };
      }),
    };
    updateAllRoutines(updated);
  };

  const deleteExercise = (sectionIdx: number, exerciseIdx: number) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return { ...section, exercises: section.exercises.filter((_, ei) => ei !== exerciseIdx) };
      }),
    };
    updateAllRoutines(updated);
  };

  const reorderExercise = (sectionIdx: number, fromIdx: number, toIdx: number) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        const exercises = [...section.exercises];
        const [moved] = exercises.splice(fromIdx, 1);
        exercises.splice(toIdx, 0, moved);
        return { ...section, exercises };
      }),
    };
    updateAllRoutines(updated);
  };

  const addExercise = async (sectionIdx: number, exercise: Exercise) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return { ...section, exercises: [...section.exercises, exercise] };
      }),
    };
    const newAll = { ...allRoutines, [updated.id]: updated };
    setAllRoutines(newAll);
    await saveAllRoutines(newAll);
  };

  const updateTitle = (newName: string) => {
    if (!routine || !newName.trim()) return;
    updateAllRoutines({ ...routine, name: newName });
  };

  const updateFrequency = (freq: string) => {
    if (!routine) return;
    updateAllRoutines({ ...routine, frequency: freq });
  };

  const switchRoutine = async (id: string) => {
    setActiveId(id);
    await saveActiveRoutineId(id);
  };

  const duplicateRoutine = async () => {
    if (!routine) return;
    const newId = `rutina_${Date.now()}`;
    const copy: Routine = {
      ...routine, id: newId, name: `${routine.name} (copia)`,
      sections: routine.sections.map((sec) => ({
        ...sec,
        exercises: sec.exercises.map((ex) => ({
          ...ex, id: generateId(), seriesCompleted: Array(ex.series).fill(false),
        })),
      })),
    };
    const newAll = { ...allRoutines, [newId]: copy };
    await saveAllRoutines(newAll);
    await saveActiveRoutineId(newId);
    setAllRoutines(newAll);
    setActiveId(newId);
  };

  const limpiarTildes = async () => {
    if (!routine) return;
    if (saveTimeout.current) { clearTimeout(saveTimeout.current); saveTimeout.current = null; }
    const clean = resetAllSeries(routine);
    const newAll = { ...allRoutines, [clean.id]: clean };
    await saveAllRoutines(newAll);
    await clearSessionStart();
    setAllRoutines(newAll);
    completedShown.current = false;
    setArrivalTime(null);
    setDepartureTime(null);
    setWorkoutDuration('');
  };

  const handleStart = async () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setArrivalTime(`${h}:${m}`);
    sessionStart.current = now;
    await saveSessionStart(now);
    setShowWelcome(false);
  };

  const progress = () => {
    if (!routine) return { done: 0, total: 0 };
    let done = 0, total = 0;
    routine.sections.forEach((s) =>
      s.exercises.forEach((ex) => {
        total += ex.seriesCompleted.length;
        done += ex.seriesCompleted.filter(Boolean).length;
      })
    );
    return { done, total };
  };

  return {
    routine, allRoutines, activeId, settings, weightHistory,
    trainingDates, loading, showWelcome, setShowWelcome,
    arrivalTime, departureTime, workoutDuration,
    toggleSeries, editExerciseField, saveExercise,
    duplicateExercise, deleteExercise, reorderExercise, addExercise,
    updateTitle, updateFrequency, switchRoutine, duplicateRoutine,
    limpiarTildes, handleStart, load, progress,
    saveTimeout, completedShown,
    allRoutinesList: Object.values(allRoutines),
  };
}
