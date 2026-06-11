import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { theme, categoryColors } from '../constants/theme';
import { Routine, WorkoutSession } from '../types';
import {
  loadAllRoutines, loadActiveRoutineId, saveActiveRoutineId, loadSessions,
} from '../utils/storage';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const SHORT_MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${SHORT_MONTHS[parseInt(m) - 1]}`;
}

export default function TodayScreen() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeId, setActiveId] = useState('');
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [all, id, sess] = await Promise.all([
      loadAllRoutines(), loadActiveRoutineId(), loadSessions(),
    ]);
    setRoutines(Object.values(all));
    setActiveId(id);
    setSessions(sess);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const lastRun = (r: Routine): string | null => {
    if (r.lastRunDate) return r.lastRunDate;
    const match = sessions.find((s) => s.routineName === r.name);
    return match ? match.date : null;
  };

  const countExercises = (r: Routine) =>
    r.sections.reduce((acc, s) => acc + s.exercises.length, 0);

  const openRoutine = async (id: string) => {
    await saveActiveRoutineId(id);
    setActiveId(id);
    router.push('/rutina');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.timerColor} />
      </View>
    );
  }

  const active = routines.find((r) => r.id === activeId) ?? routines[0];
  const others = routines.filter((r) => r.id !== active?.id);
  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Hoy</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>

        {active && (
          <View style={styles.continueCard}>
            <Text style={styles.continueLabel}>CONTINUAR RUTINA</Text>
            <Text style={styles.continueName}>{active.name}</Text>
            <Text style={styles.continueMeta}>
              {countExercises(active)} ejercicios
              {lastRun(active) ? `  ·  Última vez: ${formatShortDate(lastRun(active)!)}` : ''}
            </Text>
            <TouchableOpacity style={styles.continueBtn} onPress={() => openRoutine(active.id)}>
              <Text style={styles.continueBtnText}>EMPEZAR →</Text>
            </TouchableOpacity>
          </View>
        )}

        {others.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MIS RUTINAS</Text>
            {others.map((r) => {
              const color = categoryColors[r.category ?? 'Personalizada'];
              const last = lastRun(r);
              return (
                <TouchableOpacity key={r.id} style={styles.routineRow} onPress={() => openRoutine(r.id)}>
                  <View style={[styles.routineDot, { backgroundColor: color }]} />
                  <View style={styles.routineInfo}>
                    <Text style={styles.routineName} numberOfLines={1}>{r.name}</Text>
                    <Text style={styles.routineMeta}>
                      {countExercises(r)} ejercicios
                      {last ? `  ·  Última vez: ${formatShortDate(last)}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.routineArrow}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  center: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 20 },
  title: { color: theme.textColor, fontSize: 28, fontWeight: '800' },
  date: { color: theme.textMuted, fontSize: 14, marginTop: 2, textTransform: 'capitalize' },
  continueCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.timerColor,
    padding: 22,
    marginBottom: 28,
  },
  continueLabel: {
    color: theme.timerColor, fontSize: 11, fontWeight: '800', letterSpacing: 2,
  },
  continueName: { color: theme.textColor, fontSize: 22, fontWeight: '700', marginTop: 8 },
  continueMeta: { color: theme.textMuted, fontSize: 13, marginTop: 4 },
  continueBtn: {
    backgroundColor: theme.timerColor,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  continueBtnText: { color: '#000', fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: theme.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 2, marginBottom: 10,
  },
  routineRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.borderColor,
    padding: 16,
    marginBottom: 8,
  },
  routineDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  routineInfo: { flex: 1 },
  routineName: { color: theme.textColor, fontSize: 16, fontWeight: '600' },
  routineMeta: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  routineArrow: { color: theme.textMuted, fontSize: 22, marginLeft: 8 },
});
