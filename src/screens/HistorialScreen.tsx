import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../constants/theme';
import { loadSessions, loadProgress, loadWeightHistory, loadExerciseLog, getMaxWeight } from '../utils/storage';
import { WorkoutSession, ProgressData, ExerciseLog } from '../types';

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${d} ${MONTHS[parseInt(m) - 1]} ${y}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function HistorialScreen() {
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [weightHistory, setWeightHistory] = useState<Record<string, string>>({});
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'sesiones' | 'ejercicios' | 'pesos'>('sesiones');

  const load = useCallback(async () => {
    setLoading(true);
    const [s, p, w, log] = await Promise.all([
      loadSessions(), loadProgress(), loadWeightHistory(), loadExerciseLog(),
    ]);
    setSessions(s);
    setProgress(p);
    setWeightHistory(w);
    setExerciseLog(log);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.timerColor} />
      </View>
    );
  }

  const weightEntries = Object.entries(weightHistory).sort(([a], [b]) => a.localeCompare(b));
  const logEntries = Object.entries(exerciseLog).sort(([a], [b]) => a.localeCompare(b));

  return (
    <View style={styles.container}>
      {/* Stats bar */}
      {progress && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{progress.totalWorkouts}</Text>
            <Text style={styles.statLabel}>entrenos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{progress.totalMinutes}</Text>
            <Text style={styles.statLabel}>minutos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{Math.round(progress.totalWeight)}</Text>
            <Text style={styles.statLabel}>kg totales</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'sesiones' && styles.tabActive]}
          onPress={() => setTab('sesiones')}
        >
          <Text style={[styles.tabText, tab === 'sesiones' && styles.tabTextActive]}>
            Sesiones
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'ejercicios' && styles.tabActive]}
          onPress={() => setTab('ejercicios')}
        >
          <Text style={[styles.tabText, tab === 'ejercicios' && styles.tabTextActive]}>
            Ejercicios
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'pesos' && styles.tabActive]}
          onPress={() => setTab('pesos')}
        >
          <Text style={[styles.tabText, tab === 'pesos' && styles.tabTextActive]}>
            Pesos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'sesiones' ? (
          sessions.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏋️</Text>
              <Text style={styles.emptyText}>Todavía no hay sesiones registradas.</Text>
              <Text style={styles.emptySubText}>Completá una rutina para que aparezca acá.</Text>
            </View>
          ) : (
            sessions.map((s, i) => (
              <View key={i} style={styles.sessionCard}>
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionDate}>{formatDate(s.date)}</Text>
                  <Text style={styles.sessionDuration}>{formatDuration(s.durationMinutes)}</Text>
                </View>
                <Text style={styles.sessionRoutine}>{s.routineName}</Text>
                <View style={styles.sessionStats}>
                  <Text style={styles.sessionStat}>{s.totalSeries} series</Text>
                  {s.totalWeight > 0 && (
                    <>
                      <Text style={styles.sessionStatSep}>·</Text>
                      <Text style={styles.sessionStat}>{Math.round(s.totalWeight)} kg</Text>
                    </>
                  )}
                </View>
              </View>
            ))
          )
        ) : tab === 'ejercicios' ? (
          logEntries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📈</Text>
              <Text style={styles.emptyText}>Todavía no hay historial por ejercicio.</Text>
              <Text style={styles.emptySubText}>Completá una rutina y acá vas a ver la evolución de cada ejercicio.</Text>
            </View>
          ) : (
            logEntries.map(([name, entries]) => {
              const maxW = getMaxWeight(entries);
              const isOpen = expanded === name;
              return (
                <TouchableOpacity
                  key={name}
                  style={styles.logCard}
                  onPress={() => setExpanded(isOpen ? null : name)}
                >
                  <View style={styles.logHeader}>
                    <Text style={styles.logName} numberOfLines={1}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Text>
                    <View style={styles.logHeaderRight}>
                      {maxW > 0 && <Text style={styles.logRecord}>🏆 {maxW} kg</Text>}
                      <Text style={styles.logArrow}>{isOpen ? '▲' : '▼'}</Text>
                    </View>
                  </View>
                  {isOpen && (
                    <View style={styles.logEntries}>
                      {entries.slice(0, 5).map((e, i) => (
                        <View key={i} style={styles.logEntryRow}>
                          <Text style={styles.logEntryDate}>{formatDate(e.date)}</Text>
                          <Text style={styles.logEntryDetail}>
                            {e.series}x{e.reps}{e.weight ? `  ·  ${e.weight}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )
        ) : (
          weightEntries.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⚖️</Text>
              <Text style={styles.emptyText}>Todavía no hay pesos registrados.</Text>
              <Text style={styles.emptySubText}>Editá el peso de un ejercicio y se guardará acá.</Text>
            </View>
          ) : (
            weightEntries.map(([name, weight]) => (
              <View key={name} style={styles.weightRow}>
                <Text style={styles.weightExerciseName} numberOfLines={1}>
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </Text>
                <View style={styles.weightBadge}>
                  <Text style={styles.weightValue}>{weight}</Text>
                </View>
              </View>
            ))
          )
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  center: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 16,
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingVertical: 16,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: theme.timerColor, fontSize: 24, fontWeight: '800' },
  statLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: theme.borderColor, marginVertical: 4 },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 4,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: theme.timerColor },
  tabText: { color: theme.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: '#000', fontWeight: '800' },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 4 },

  sessionCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  sessionDate: { color: theme.textColor, fontSize: 15, fontWeight: '700' },
  sessionDuration: { color: theme.timerColor, fontSize: 14, fontWeight: '700' },
  sessionRoutine: { color: theme.textMuted, fontSize: 12, marginBottom: 8 },
  sessionStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionStat: { color: theme.textMuted, fontSize: 12 },
  sessionStatSep: { color: theme.borderColor, fontSize: 12, marginHorizontal: 2 },

  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  weightExerciseName: { color: theme.textColor, fontSize: 14, fontWeight: '500', flex: 1, marginRight: 12 },
  weightBadge: {
    backgroundColor: theme.borderColor,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  weightValue: { color: theme.timerColor, fontSize: 14, fontWeight: '800' },

  logCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  logHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logName: { color: theme.textColor, fontSize: 14, fontWeight: '600', flex: 1, marginRight: 12 },
  logHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logRecord: { color: theme.warning, fontSize: 12, fontWeight: '800' },
  logArrow: { color: theme.textMuted, fontSize: 10 },
  logEntries: { marginTop: 12, gap: 6 },
  logEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: theme.backgroundColor,
    borderRadius: 8,
  },
  logEntryDate: { color: theme.textMuted, fontSize: 12 },
  logEntryDetail: { color: theme.timerColor, fontSize: 12, fontWeight: '700' },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: theme.textColor, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubText: { color: theme.textMuted, fontSize: 13, textAlign: 'center' },
});
