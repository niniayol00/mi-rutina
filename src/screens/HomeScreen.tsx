import React, { useCallback, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, TextInput,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { Routine, AppSettings, Exercise, WorkoutSession } from '../types';
import {
  loadRoutine, loadSettings, saveRoutine, checkAndResetIfNewDay,
  loadTrainingDates, saveTrainingDate, loadProgress, saveProgress, saveSession,
  resetAllSeries,
} from '../utils/storage';
import { theme } from '../constants/theme';
import TimerModal from '../components/TimerModal';
import CalendarModal from '../components/CalendarModal';
import AddExerciseModal from '../components/AddExerciseModal';
import DraggableExerciseList from '../components/DraggableExerciseList';

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function HomeScreen() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [timerWorkSeconds, setTimerWorkSeconds] = useState<number | undefined>(undefined);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [addVisible, setAddVisible] = useState(false);
  const [trainingDates, setTrainingDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTitle, setEditingTitle] = useState(false);
  const [sessionStart] = useState<Date>(new Date());
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedShown = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, s, dates] = await Promise.all([loadRoutine(), loadSettings(), loadTrainingDates()]);
    const { routine: checked, settings: checkedSettings } = await checkAndResetIfNewDay(r, s);

    // Si al cargar todos los ejercicios están completos, limpiar el estado directamente
    const allDoneOnLoad = checked.sections.every((sec) =>
      sec.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
    );
    if (allDoneOnLoad && checked.sections.some((s) => s.exercises.length > 0)) {
      const clean = resetAllSeries(checked);
      await saveRoutine(clean);
      setRoutine(clean);
    } else {
      setRoutine(checked);
    }

    setSettings(checkedSettings);
    setTrainingDates(dates);
    completedShown.current = false;
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const persistRoutine = (updated: Routine) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveRoutine(updated), 400);
  };

  const getToday = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const checkAllCompleted = useCallback(async (updated: Routine) => {
    if (completedShown.current) return;
    const allDone = updated.sections.every((s) =>
      s.exercises.every((ex) => ex.seriesCompleted.every(Boolean))
    );
    if (!allDone) return;
    completedShown.current = true;

    const endTime = new Date();
    const durationMinutes = Math.round((endTime.getTime() - sessionStart.getTime()) / 60000);
    let totalSeries = 0, totalWeight = 0;
    updated.sections.forEach((s) => s.exercises.forEach((ex) => {
      totalSeries += ex.series;
      if (ex.weight) {
        const kg = parseFloat(ex.weight);
        if (!isNaN(kg)) totalWeight += kg * ex.series;
      }
    }));

    const today = getToday();
    const session: WorkoutSession = {
      date: today,
      startTime: sessionStart.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes,
      totalSeries,
      totalWeight,
      routineName: updated.name,
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

    // Cancela cualquier save pendiente
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }

    // NO resetea aqui — el reset ocurre cuando el usuario cierra el calendario
    await saveRoutine(updated);
  }, [sessionStart]);

  const toggleSeries = (sectionIdx: number, exerciseIdx: number, seriesIdx: number) => {
    if (!routine) return;
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
    setRoutine(updated);
    persistRoutine(updated);
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
    setRoutine(updated);
    persistRoutine(updated);
  };

  const duplicateExercise = (sectionIdx: number, exerciseIdx: number) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        const exercises = [...section.exercises];
        const original = exercises[exerciseIdx];
        const copy: Exercise = {
          ...original,
          id: generateId(),
          name: `${original.name} (copia)`,
          seriesCompleted: Array(original.series).fill(false),
        };
        exercises.splice(exerciseIdx + 1, 0, copy);
        return { ...section, exercises };
      }),
    };
    setRoutine(updated);
    persistRoutine(updated);
  };

  const deleteExercise = (sectionIdx: number, exerciseIdx: number) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return {
          ...section,
          exercises: section.exercises.filter((_, ei) => ei !== exerciseIdx),
        };
      }),
    };
    setRoutine(updated);
    persistRoutine(updated);
  };

  const saveExercise = (sectionIdx: number, exerciseIdx: number, updated: Exercise) => {
    if (!routine) return;
    const updatedRoutine: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return {
          ...section,
          exercises: section.exercises.map((ex, ei) =>
            ei === exerciseIdx ? updated : ex
          ),
        };
      }),
    };
    setRoutine(updatedRoutine);
    persistRoutine(updatedRoutine);
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
    setRoutine(updated);
    persistRoutine(updated);
  };

  const addExercise = (sectionIdx: number, exercise: Exercise) => {
    if (!routine) return;
    const updated: Routine = {
      ...routine,
      sections: routine.sections.map((section, si) => {
        if (si !== sectionIdx) return section;
        return { ...section, exercises: [...section.exercises, exercise] };
      }),
    };
    setRoutine(updated);
    persistRoutine(updated);
  };

  const updateTitle = (newName: string) => {
    if (!routine || !newName.trim()) return;
    const updated = { ...routine, name: newName };
    setRoutine(updated);
    persistRoutine(updated);
  };

  const handleVerCalendario = async () => {
    if (!routine) return;
    if (saveTimeout.current) {
      clearTimeout(saveTimeout.current);
      saveTimeout.current = null;
    }
    const clean = resetAllSeries(routine);
    // Guarda el estado limpio en storage como fuente de verdad
    await saveRoutine(clean);
    completedShown.current = false;
    setCalendarVisible(true);
  };

  const handleCerrarCalendario = async () => {
    setCalendarVisible(false);
    // Lee el estado limpio desde storage y actualiza React —
    // esto garantiza que lo que se muestra coincide con lo guardado
    const fresh = await loadRoutine();
    setRoutine(fresh);
  };

  const startTimer = (seconds: number, workSeconds?: number) => {
    setTimerSeconds(seconds);
    setTimerWorkSeconds(workSeconds);
    setTimerVisible(true);
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

  const { done, total } = progress();

  if (loading || !routine || !settings) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Cargando rutina...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          {editingTitle ? (
            <TextInput
              style={styles.titleInput}
              value={routine.name}
              onChangeText={updateTitle}
              onBlur={() => setEditingTitle(false)}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingTitle(true)}>
              <Text style={styles.title}>{routine.name}</Text>
            </TouchableOpacity>
          )}
          <Text style={styles.subtitle}>{routine.frequency}</Text>
        </View>
        <TouchableOpacity style={styles.newRoutineBtn} onPress={() => router.push('/input')}>
          <Text style={styles.newRoutineText}>Nueva rutina</Text>
        </TouchableOpacity>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{done}/{total}</Text>
          <Text style={styles.progressLabel}>series</Text>
        </View>
      </View>

      {total > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${(done / total) * 100}%` }]} />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
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

        {done === total && total > 0 && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeText}>RUTINA COMPLETADA</Text>
            <TouchableOpacity style={styles.verCalendarioBtn} onPress={handleVerCalendario}>
              <Text style={styles.verCalendarioBtnText}>VER CALENDARIO</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setAddVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
        onClose={handleCerrarCalendario}
      />

      <AddExerciseModal
        visible={addVisible}
        sections={routine.sections}
        onAdd={addExercise}
        onClose={() => setAddVisible(false)}
      />
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
  newRoutineBtn: {
    borderWidth: 1, borderColor: theme.borderColor, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6, marginRight: 10,
  },
  newRoutineText: { color: theme.textMuted, fontSize: 12, fontWeight: '600' },
  progressBadge: {
    alignItems: 'center', backgroundColor: theme.cardBackground,
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1, borderColor: theme.borderColor,
  },
  progressText: { color: theme.timerColor, fontSize: 20, fontWeight: '700' },
  progressLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 1 },
  progressBarContainer: {
    height: 2, backgroundColor: theme.borderColor,
    marginHorizontal: 20, borderRadius: 1, marginBottom: 8,
  },
  progressBar: { height: 2, backgroundColor: theme.timerColor, borderRadius: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },
  section: { marginBottom: 24 },
  sectionName: {
    color: theme.textMuted, fontSize: theme.fontSize.section,
    fontWeight: '600', letterSpacing: 2, marginBottom: 10, marginLeft: 2,
  },
  completeBanner: { alignItems: 'center', paddingVertical: 24, gap: 14 },
  completeText: { color: theme.timerColor, fontSize: 18, fontWeight: '700', letterSpacing: 3 },
  completeSub: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  verCalendarioBtn: {
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 32,
  },
  verCalendarioBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
  fab: {
    position: 'absolute', bottom: 32, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: theme.timerColor,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: theme.timerColor, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#000', fontSize: 28, fontWeight: '600', lineHeight: 32 },
});
