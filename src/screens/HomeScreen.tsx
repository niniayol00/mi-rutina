import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Routine, AppSettings } from '../types';
import { loadRoutine, loadSettings, saveRoutine, checkAndResetIfNewDay } from '../utils/storage';
import { theme } from '../constants/theme';
import ExerciseCard from '../components/ExerciseCard';
import TimerModal from '../components/TimerModal';

export default function HomeScreen() {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [timerVisible, setTimerVisible] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [loading, setLoading] = useState(true);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r, s] = await Promise.all([loadRoutine(), loadSettings()]);
    const { routine: checkedRoutine, settings: checkedSettings } = await checkAndResetIfNewDay(r, s);
    setRoutine(checkedRoutine);
    setSettings(checkedSettings);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const persistRoutine = (updated: Routine) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => saveRoutine(updated), 400);
  };

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
  };

  const editExerciseField = (
    sectionIdx: number,
    exerciseIdx: number,
    field: string,
    value: string
  ) => {
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

  const [timerWorkSeconds, setTimerWorkSeconds] = useState<number | undefined>(undefined);

  const startTimer = (seconds: number, workSeconds?: number) => {
    setTimerSeconds(seconds);
    setTimerWorkSeconds(workSeconds);
    setTimerVisible(true);
  };

  const progress = () => {
    if (!routine) return { done: 0, total: 0 };
    let done = 0;
    let total = 0;
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
        <View>
          <Text style={styles.title}>{routine.name}</Text>
          <Text style={styles.subtitle}>{routine.frequency}</Text>
        </View>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>
            {done}/{total}
          </Text>
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
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.timerColor} />
        }
        showsVerticalScrollIndicator={false}
      >
        {routine.sections.map((section, si) => (
          <View key={si} style={styles.section}>
            <Text style={styles.sectionName}>{section.name.toUpperCase()}</Text>
            {section.exercises.map((exercise, ei) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                editable={settings.editableFields}
                vibrationOnCheck={settings.vibrationOnCheck}
                autoStartTimer={settings.autoStartTimerOnCheck}
                onToggleSeries={(si2) => toggleSeries(si, ei, si2)}
                onEdit={(field, value) => editExerciseField(si, ei, field as string, value)}
                onTimerStart={startTimer}
              />
            ))}
          </View>
        ))}

        {done === total && total > 0 && (
          <View style={styles.completeBanner}>
            <Text style={styles.completeText}>RUTINA COMPLETADA</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <TimerModal
        visible={timerVisible}
        seconds={timerSeconds}
        workSeconds={timerWorkSeconds}
        quickButtons={settings.quickTimeButtons}
        soundOnFinish={settings.soundOnFinish}
        vibrationOnFinish={settings.vibrationOnFinish}
        onClose={() => setTimerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  loading: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: theme.textMuted,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    color: theme.textColor,
    fontSize: theme.fontSize.title,
    fontWeight: '700',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: theme.fontSize.small,
    marginTop: 2,
  },
  progressBadge: {
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  progressText: {
    color: theme.timerColor,
    fontSize: 20,
    fontWeight: '700',
  },
  progressLabel: {
    color: theme.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  progressBarContainer: {
    height: 2,
    backgroundColor: theme.borderColor,
    marginHorizontal: 20,
    borderRadius: 1,
    marginBottom: 8,
  },
  progressBar: {
    height: 2,
    backgroundColor: theme.timerColor,
    borderRadius: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionName: {
    color: theme.textMuted,
    fontSize: theme.fontSize.section,
    fontWeight: '600',
    letterSpacing: 2,
    marginBottom: 10,
    marginLeft: 2,
  },
  completeBanner: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  completeText: {
    color: theme.timerColor,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 3,
  },
});
