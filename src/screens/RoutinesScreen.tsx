import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { theme, categoryColors, categoryIcons, CATEGORIES } from '../constants/theme';
import { Routine, RoutineCategory, WorkoutSession } from '../types';
import {
  loadAllRoutines, loadActiveRoutineId, saveActiveRoutineId,
  deleteRoutine, addOrUpdateRoutine, loadSessions,
} from '../utils/storage';

const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-');
  return `${parseInt(d)} ${MONTHS[parseInt(m) - 1]}`;
}

function confirmAction(title: string, message: string, onOk: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n${message}`)) onOk();
  } else {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: onOk },
    ]);
  }
}

export default function RoutinesScreen() {
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

  const countExercises = (r: Routine) =>
    r.sections.reduce((acc, s) => acc + s.exercises.length, 0);

  const lastRun = (r: Routine): string | null => {
    if (r.lastRunDate) return r.lastRunDate;
    const match = sessions.find((s) => s.routineName === r.name);
    return match ? match.date : null;
  };

  const selectRoutine = async (id: string) => {
    await saveActiveRoutineId(id);
    setActiveId(id);
    router.push('/rutina');
  };

  const handleDelete = (r: Routine) => {
    if (routines.length <= 1) {
      if (Platform.OS === 'web') window.alert('No podés eliminar tu única rutina.');
      else Alert.alert('Atención', 'No podés eliminar tu única rutina.');
      return;
    }
    confirmAction('Eliminar rutina', `¿Eliminar "${r.name}"? Esta acción no se puede deshacer.`, async () => {
      const all = await deleteRoutine(r.id);
      setRoutines(Object.values(all));
      const newActive = await loadActiveRoutineId();
      setActiveId(newActive);
    });
  };

  const cycleCategory = async (r: Routine) => {
    const current = r.category ?? 'Personalizada';
    const idx = CATEGORIES.indexOf(current as (typeof CATEGORIES)[number]);
    const next = CATEGORIES[(idx + 1) % CATEGORIES.length] as RoutineCategory;
    const updated = { ...r, category: next };
    await addOrUpdateRoutine(updated);
    setRoutines((prev) => prev.map((x) => (x.id === r.id ? updated : x)));
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.timerColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Rutinas</Text>
        <Text style={styles.subtitle}>
          {routines.length} rutina{routines.length !== 1 ? 's' : ''} · tocá una para entrenar
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {routines.map((r) => {
          const cat = r.category ?? 'Personalizada';
          const color = categoryColors[cat];
          const last = lastRun(r);
          const isActive = r.id === activeId;
          return (
            <TouchableOpacity
              key={r.id}
              style={[styles.card, isActive && { borderColor: color }]}
              onPress={() => selectRoutine(r.id)}
              onLongPress={() => handleDelete(r)}
              delayLongPress={600}
            >
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>{r.name}</Text>
                  {isActive && (
                    <View style={[styles.activeBadge, { borderColor: color }]}>
                      <Text style={[styles.activeBadgeText, { color }]}>ACTIVA</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardMeta}>
                  {countExercises(r)} ejercicios
                  {last ? `  ·  Última vez: ${formatDate(last)}` : '  ·  Nunca realizada'}
                </Text>
                <View style={styles.cardBottom}>
                  <TouchableOpacity
                    style={[styles.categoryChip, { borderColor: color }]}
                    onPress={() => cycleCategory(r)}
                  >
                    <Text style={styles.categoryChipText}>
                      {categoryIcons[cat]} <Text style={{ color }}>{cat}</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.hint}>Mantené presionada una tarjeta para eliminarla</Text>
        <View style={{ height: 100 }} />
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/input')}>
        <Text style={styles.fabText}>+ Nueva Rutina</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  center: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { color: theme.textColor, fontSize: 24, fontWeight: '700' },
  subtitle: { color: theme.textMuted, fontSize: 13, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16 },
  card: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
    overflow: 'hidden',
  },
  colorBar: { width: 5 },
  cardBody: { flex: 1, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardName: { color: theme.textColor, fontSize: 17, fontWeight: '700', flex: 1, marginRight: 8 },
  activeBadge: {
    borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  cardMeta: { color: theme.textMuted, fontSize: 12, marginTop: 4 },
  cardBottom: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginTop: 10,
  },
  categoryChip: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  categoryChipText: { fontSize: 11, color: theme.textMuted, fontWeight: '600' },
  completedText: { color: theme.textMuted, fontSize: 11, fontWeight: '600' },
  hint: { color: theme.textMuted, fontSize: 11, textAlign: 'center', marginTop: 8, opacity: 0.7 },
  fab: {
    position: 'absolute', bottom: 20, right: 20,
    backgroundColor: theme.timerColor,
    borderRadius: 28,
    paddingVertical: 14, paddingHorizontal: 22,
    shadowColor: theme.timerColor, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 10, elevation: 8,
  },
  fabText: { color: '#000', fontSize: 15, fontWeight: '800' },
});
