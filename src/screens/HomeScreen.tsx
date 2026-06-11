import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput, Animated, Platform, Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Routine, AppSettings, Exercise, WorkoutSession, SessionExercise } from '../types';
import {
  loadAllRoutines, saveAllRoutines, loadActiveRoutineId, saveActiveRoutineId,
  loadActiveRoutine, saveActiveRoutine, loadSettings, saveSettings,
  checkAndResetIfNewDay, loadTrainingDates, saveTrainingDate,
  loadProgress, saveProgress, saveSession, resetAllSeries,
  loadWeightHistory, updateWeightForExercise, shouldShowWelcomeToday,
  loadSessionStart, saveSessionStart, clearSessionStart, logCompletedWorkout,
} from '../utils/storage';
import { theme } from '../constants/theme';
import TimerModal from '../components/TimerModal';
import CalendarModal from '../components/CalendarModal';
import AddExerciseModal from '../components/AddExerciseModal';
import DraggableExerciseList from '../components/DraggableExerciseList';
import FabMenu from '../components/FabMenu';
import CompletionModal from '../components/CompletionModal';
import WelcomeScreen from '../components/WelcomeScreen';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function HomeScreen() {
  const [allRoutines, setAllRoutines] = useState<Record<string, Routine>>({});
  const [activeId, setActiveId] = useState<string>('');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [weightHistory, setWeightHistory] = useState<Record<string, string>>({});
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerWorkSeconds, setTimerWorkSeconds] = useState<number | undefined>(undefined);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [fabMenuVisible, setFabMenuVisible] = useState(false);
  const [completionVisible, setCompletionVisible] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [trainingDates, setTrainingDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingFrequency, setEditingFrequency] = useState(false);
  const [sessionStart, setSessionStart] = useState<Date>(new Date());
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [departureTime, setDepartureTime] = useState<string | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState<string>('');
  const [newRecords, setNewRecords] = useState<string[]>([]);
  const [completedExercises, setCompletedExercises] = useState(0);

  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedShown = useRef(false);
  const firstCheckDone = useRef(false);
  const listOpacity = useRef(new Animated.Value(1)).current;

  const routine = allRoutines[activeId] ?? null;

  // ─── Load ───────────────────────────────────────────────────────

  const load = useCallback(async () => {
    setLoading(true);
    const [all, activeIdRaw, s, dates, wh, savedStart] = await Promise.all([
      loadAllRoutines(), loadActiveRoutineId(), loadSettings(), loadTrainingDates(), loadWeightHistory(), loadSessionStart(),
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

    // Si la rutina activa tiene todos los ejercicios completos, limpiarla
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

    // Restaurar sessionStart desde storage o usar el actual
    if (savedStart) {
      setSessionStart(savedStart);
      const h = String(savedStart.getHours()).padStart(2, '0');
      const m = String(savedStart.getMinutes()).padStart(2, '0');
      setArrivalTime(`${h}:${m}`);
    } else {
      setArrivalTime(null);
    }

    setDepartureTime(null);
    setWorkoutDuration('');
    const showW = await shouldShowWelcomeToday();
    setShowWelcome(showW);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  // ─── Persist ────────────────────────────────────────────────────

  const persistRoutine = (updated: Routine) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveActiveRoutine(updated), 400);
  };

  const updateAllRoutines = (updated: Routine) => {
    const newAll = { ...allRoutines, [updated.id]: updated };
    setAllRoutines(newAll);
    persistRoutine(updated);
  };

  // ─── Completion ─────────────────────────────────────────────────

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const checkAllCompleted = useCallback(async (updated: Routine, force = false) => {
    if (completedShown.current) return;
    const allDone = updated.sections.every((s) =>
      s.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
    );
    if (!allDone && !force) return;
    completedShown.current = true;

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - sessionStart.getTime()) / 60000);
    let totalSeries = 0, totalWeight = 0, exercisesDone = 0;
    const sessionExercises: SessionExercise[] = [];
    updated.sections.forEach((s) => s.exercises.forEach((ex) => {
      totalSeries += ex.series;
      if (ex.weight) {
        const kg = parseFloat(ex.weight);
        if (!isNaN(kg)) totalWeight += kg * ex.series;
      }
      if (ex.seriesCompleted.every(Boolean)) exercisesDone += 1;
      if (ex.seriesCompleted.some(Boolean)) {
        sessionExercises.push({
          name: ex.name, series: ex.series, reps: ex.reps, weight: ex.weight,
        });
      }
    }));
    setCompletedExercises(exercisesDone);

    const today = getToday();
    const session: WorkoutSession = {
      date: today, startTime: sessionStart.toISOString(),
      endTime: endTime.toISOString(), durationMinutes,
      totalSeries, totalWeight, routineName: updated.name,
      exercises: sessionExercises,
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

    // Historial por ejercicio + récords personales
    const records = await logCompletedWorkout(updated, today);
    setNewRecords(records);

    // Actualizar estadísticas de la rutina (veces completada, última ejecución)
    if (saveTimeout.current) { clearTimeout(saveTimeout.current); saveTimeout.current = null; }
    const withStats: Routine = {
      ...updated,
      timesCompleted: (updated.timesCompleted ?? 0) + 1,
      lastRunDate: today,
    };
    setAllRoutines((prev) => ({ ...prev, [withStats.id]: withStats }));
    await saveActiveRoutine(withStats);

    // Registrar hora de salida y calcular duración
    const depH = String(endTime.getHours()).padStart(2, '0');
    const depM = String(endTime.getMinutes()).padStart(2, '0');
    setDepartureTime(`${depH}:${depM}`);
    const totalMin = Math.round((endTime.getTime() - sessionStart.getTime()) / 60000);
    const hours = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    const durStr = hours > 0
      ? `${hours} hora${hours > 1 ? 's' : ''} ${mins > 0 ? `${mins} minuto${mins > 1 ? 's' : ''}` : ''}`
      : `${mins} minuto${mins !== 1 ? 's' : ''}`;
    setWorkoutDuration(durStr.trim());

    // Mostrar modal de completado
    setCompletionVisible(true);
  }, [sessionStart]);

  // ─── handleRoutineCompletion ─────────────────────────────────────

  const handleGoToRoutines = async () => {
    if (!routine) return;
    setCompletionVisible(false);
    if (saveTimeout.current) { clearTimeout(saveTimeout.current); saveTimeout.current = null; }
    // Guarda estado limpio preservando pesos como fuente de verdad
    const clean = resetAllSeries(routine);
    const newAll = { ...allRoutines, [clean.id]: clean };
    await saveAllRoutines(newAll);
    await clearSessionStart();
    completedShown.current = false;
    router.replace('/rutinas');
  };

  const finalizarRutina = () => {
    if (!routine || completedShown.current) return;
    const allDone = routine.sections.every((s) =>
      s.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
    );
    if (allDone) {
      checkAllCompleted(routine);
      return;
    }
    const msg = 'Te quedan series sin marcar. ¿Finalizar la rutina igual?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) checkAllCompleted(routine, true);
    } else {
      Alert.alert('Finalizar rutina', msg, [
        { text: 'Seguir entrenando', style: 'cancel' },
        { text: 'Finalizar', onPress: () => checkAllCompleted(routine, true) },
      ]);
    }
  };

  const duplicateRoutine = async () => {
    if (!routine) return;
    const newId = `rutina_${Date.now()}`;
    const copy: Routine = {
      ...routine,
      id: newId,
      name: `${routine.name} (copia)`,
      sections: routine.sections.map((sec) => ({
        ...sec,
        exercises: sec.exercises.map((ex) => ({
          ...ex,
          id: generateId(),
          seriesCompleted: Array(ex.series).fill(false),
        })),
      })),
    };
    const newAll = { ...allRoutines, [newId]: copy };
    await saveAllRoutines(newAll);
    await saveActiveRoutineId(newId);
    setAllRoutines(newAll);
    setActiveId(newId);
  };

  // ─── Exercise actions ────────────────────────────────────────────

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
      setSessionStart(now);
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

  const saveExercise = async (sectionIdx: number, exerciseIdx: number, updated: Exercise) => {
    if (!routine) return;
    const updatedRoutine: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return {
          ...section,
          exercises: section.exercises.map((ex, ei) => ei === exerciseIdx ? updated : ex),
        };
      }),
    };
    updateAllRoutines(updatedRoutine);
    // Guardar peso en historial si se cambió
    if (updated.weight) {
      await updateWeightForExercise(updated.name, updated.weight);
      setWeightHistory(prev => ({
        ...prev,
        [updated.name.toLowerCase().trim()]: updated.weight!,
      }));
    }
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
    // Guardar inmediatamente sin debounce para que no se pierda al cerrar
    await saveAllRoutines(newAll);
  };

  const updateTitle = (newName: string) => {
    if (!routine || !newName.trim()) return;
    updateAllRoutines({ ...routine, name: newName });
  };

  const limpiarTildes = async () => {
    if (!routine) return;
    const clean = resetAllSeries(routine);
    const newAll = { ...allRoutines, [clean.id]: clean };
    await saveAllRoutines(newAll);
    await clearSessionStart();
    Animated.timing(listOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setAllRoutines(newAll);
      setArrivalTime(null);
      setDepartureTime(null);
      setWorkoutDuration('');
      Animated.timing(listOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  };

  const handleStart = async () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setArrivalTime(`${h}:${m}`);
    setSessionStart(now);
    await saveSessionStart(now);
    setShowWelcome(false);
  };

  const startTimer = (seconds: number, workSeconds?: number) => {
    setTimerSeconds(seconds);
    setTimerWorkSeconds(workSeconds);
    setTimerVisible(true);
  };

  // ─── Progress ────────────────────────────────────────────────────

  const { done, total, exDone, exTotal, pct } = (() => {
    if (!routine) return { done: 0, total: 0, exDone: 0, exTotal: 0, pct: 0 };
    let done = 0, total = 0, exDone = 0, exTotal = 0;
    routine.sections.forEach((s) =>
      s.exercises.forEach((ex) => {
        total += ex.seriesCompleted.length;
        done += ex.seriesCompleted.filter(Boolean).length;
        exTotal += 1;
        if (ex.seriesCompleted.length > 0 && ex.seriesCompleted.every(Boolean)) exDone += 1;
      })
    );
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, exDone, exTotal, pct };
  })();

  // ─── Render ──────────────────────────────────────────────────────

  if (loading || !routine || !settings) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando rutina...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          {editingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={routine.name}
              onChangeText={updateTitle}
              onBlur={() => setEditingTitle(false)}
              autoFocus selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingTitle(true)}>
              <Text style={styles.title}>{routine.name}</Text>
            </TouchableOpacity>
          )}
          {editingFrequency ? (
            <TextInput
              style={styles.subtitleInput}
              value={routine.frequency}
              onChangeText={(v) => updateAllRoutines({ ...routine, frequency: v })}
              onBlur={() => setEditingFrequency(false)}
              autoFocus
              placeholder="ej: 2 veces por semana"
              placeholderTextColor={theme.checkboxInactive}
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingFrequency(true)}>
              <Text style={styles.subtitle}>{routine.frequency || 'Tocar para agregar frecuencia'}</Text>
            </TouchableOpacity>
          )}
          {arrivalTime && (
            <Text style={styles.timeInfo}>
              Entrada {arrivalTime}{departureTime ? `  ·  Salida ${departureTime}` : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.headerFab} onPress={() => setFabMenuVisible(true)}>
          <Text style={styles.headerFabText}>+</Text>
        </TouchableOpacity>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{exDone}/{exTotal}</Text>
          <Text style={styles.progressLabel}>ejercicios</Text>
        </View>
      </View>

      {/* Progress bar + porcentaje */}
      {total > 0 && (
        <View style={styles.progressRow}>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${pct}%` }]} />
          </View>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
      )}

      {/* Exercise list with fade animation */}
      <Animated.ScrollView
        style={[styles.scroll, { opacity: listOpacity }]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.timerColor} />}
        showsVerticalScrollIndicator={false}
      >
        {routine.sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionName}>{section.name.toUpperCase()}</Text>
            <DraggableExerciseList
              section={section}
              sectionIdx={si}
              editable={settings.editableFields}
              vibrationOnCheck={settings.vibrationOnCheck}
              autoStartTimer={settings.autoStartTimerOnCheck}
              weightHistory={weightHistory}
              onToggleSeries={(ei, si2) => toggleSeries(si, ei, si2)}
              onEdit={(ei, field, value) => editExerciseField(si, ei, field, value)}
              onSaveAll={(ei, updated) => saveExercise(si, ei, updated)}
              onTimerStart={startTimer}
              onReorder={(from, to) => reorderExercise(si, from, to)}
              onDuplicate={(ei) => duplicateExercise(si, ei)}
              onDelete={(ei) => deleteExercise(si, ei)}
            />
          </View>
        ))}

        {done > 0 && done < total && (
          <TouchableOpacity style={styles.finishBar} onPress={finalizarRutina}>
            <Text style={styles.finishBarText}>FINALIZAR RUTINA</Text>
          </TouchableOpacity>
        )}

        {done > 0 && done < total && (
          <TouchableOpacity style={styles.clearBar} onPress={limpiarTildes}>
            <Text style={styles.clearBarText}>Borrar todos los tildes</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </Animated.ScrollView>


      <TimerModal
        visible={timerVisible}
        seconds={timerSeconds}
        workSeconds={timerWorkSeconds}
        quickButtons={settings.quickTimeButtons}
        soundOnFinish={settings.soundOnFinish}
        vibrationOnFinish={settings.vibrationOnFinish}
        onClose={() => setTimerVisible(false)}
      />

      <CalendarModal
        visible={calendarVisible}
        trainingDates={trainingDates}
        onClose={() => setCalendarVisible(false)}
      />

      <AddExerciseModal
        visible={addVisible}
        sections={routine.sections}
        onAdd={addExercise}
        onClose={() => setAddVisible(false)}
      />

      <FabMenu
        visible={fabMenuVisible}
        onClose={() => setFabMenuVisible(false)}
        onAddExercise={() => setAddVisible(true)}
        onNewRoutine={() => router.push('/input')}
        onDuplicateRoutine={duplicateRoutine}
        onCalendar={() => setCalendarVisible(true)}
      />

      <CompletionModal
        visible={completionVisible}
        userName={settings.userName || ''}
        routineName={routine.name}
        exercisesDone={completedExercises}
        exercisesTotal={exTotal}
        records={newRecords}
        onGoToRoutines={handleGoToRoutines}
      />

      {showWelcome && !loading && (
        <WelcomeScreen
          routineName={routine.name}
          onStart={handleStart}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  loading: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: theme.textMuted, fontSize: 16 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12,
  },
  title: { color: theme.textColor, fontSize: theme.fontSize.title, fontWeight: '700' },
  titleInput: {
    color: theme.textColor, fontSize: theme.fontSize.title, fontWeight: '700',
    borderBottomWidth: 2, borderBottomColor: theme.timerColor, paddingVertical: 2,
  },
  subtitle: { color: theme.textMuted, fontSize: theme.fontSize.small, marginTop: 2 },
  subtitleInput: {
    color: theme.textMuted, fontSize: theme.fontSize.small, marginTop: 2,
    borderBottomWidth: 1, borderBottomColor: theme.timerColor, paddingVertical: 1, minWidth: 120,
  },
  timeInfo: { color: theme.timerColor, fontSize: 11, marginTop: 3, fontWeight: '600' },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 8, marginTop: 2,
    backgroundColor: theme.cardBackground,
    borderWidth: 1, borderColor: theme.borderColor,
  },
  backBtnText: { color: theme.textColor, fontSize: 18, lineHeight: 22 },
  finishBar: {
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  finishBarText: { color: '#000', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  clearBar: {
    backgroundColor: theme.cardBackground,
    borderWidth: 1,
    borderColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
  },
  clearBarText: { color: theme.timerColor, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
  headerFab: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.timerColor,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 10,
    shadowColor: theme.timerColor, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  headerFabText: { color: '#000', fontSize: 24, fontWeight: '700', lineHeight: 28 },
  progressBadge: {
    alignItems: 'center', backgroundColor: theme.cardBackground,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.borderColor,
  },
  progressText: { color: theme.timerColor, fontSize: 20, fontWeight: '700' },
  progressLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 1 },
  switcherScroll: { maxHeight: 44 },
  switcherContent: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  switcherTab: {
    borderWidth: 1, borderColor: theme.borderColor, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 6,
  },
  switcherTabActive: { backgroundColor: theme.timerColor, borderColor: theme.timerColor },
  switcherText: { color: theme.textMuted, fontSize: 13 },
  switcherTextActive: { color: '#000', fontWeight: '700' },
  progressRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 8, marginTop: 4, gap: 10,
  },
  progressBarContainer: {
    flex: 1, height: 4, backgroundColor: theme.borderColor, borderRadius: 2,
  },
  progressBar: { height: 4, backgroundColor: theme.timerColor, borderRadius: 2 },
  progressPct: {
    color: theme.timerColor, fontSize: 12, fontWeight: '700',
    minWidth: 38, textAlign: 'right',
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionName: {
    color: theme.textMuted, fontSize: theme.fontSize.section,
    fontWeight: '600', letterSpacing: 2, marginBottom: 10, marginLeft: 2,
  },
  limpiarBtn: {
    borderWidth: 1, borderColor: theme.timerColor, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 32, marginVertical: 8,
  },
  limpiarBtnText: { color: theme.timerColor, fontSize: 14, fontWeight: '700' },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.timerColor, justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.timerColor, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '600', lineHeight: 32 },
});
