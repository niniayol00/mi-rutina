import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../constants/theme';
import { AppSettings, ProgressData } from '../types';
import {
  loadSettings, saveSettings, loadProgress, loadTrainingDates, calcStreak,
} from '../utils/storage';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleTexts}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: theme.borderColor, true: theme.timerColor }}
        thumbColor={value ? '#000' : theme.textMuted}
      />
    </View>
  );
}

export default function PerfilScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [streak, setStreak] = useState(0);

  const load = useCallback(async () => {
    const [s, p, dates] = await Promise.all([
      loadSettings(), loadProgress(), loadTrainingDates(),
    ]);
    setSettings(s);
    setProgress(p);
    setStreak(calcStreak(dates));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveSettings(updated);
  };

  if (!settings) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.timerColor} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.avatar}>💪</Text>
          <Text style={styles.name}>Yol</Text>
          {streak > 1 && <Text style={styles.streak}>🔥 {streak} días seguidos</Text>}
        </View>

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

        <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>

        <View style={styles.settingsCard}>
          <ToggleRow
            label="Timer automático"
            description="Inicia el descanso al marcar una serie"
            value={settings.autoStartTimerOnCheck}
            onChange={(v) => update({ autoStartTimerOnCheck: v })}
          />
          <View style={styles.separator} />
          <ToggleRow
            label="Sonido al terminar"
            description="Beep cuando termina el descanso"
            value={settings.soundOnFinish}
            onChange={(v) => update({ soundOnFinish: v })}
          />
          <View style={styles.separator} />
          <ToggleRow
            label="Vibración al marcar"
            description="Vibra al tildar cada serie"
            value={settings.vibrationOnCheck}
            onChange={(v) => update({ vibrationOnCheck: v })}
          />
          <View style={styles.separator} />
          <ToggleRow
            label="Vibración al terminar"
            description="Vibra cuando termina el descanso"
            value={settings.vibrationOnFinish}
            onChange={(v) => update({ vibrationOnFinish: v })}
          />
          <View style={styles.separator} />
          <ToggleRow
            label="Reset diario"
            description="Borra los tildes automáticamente cada día"
            value={settings.dailyResetSeries}
            onChange={(v) => update({ dailyResetSeries: v })}
          />
          <View style={styles.separator} />
          <ToggleRow
            label="Campos editables"
            description="Permite editar ejercicios con mantener presionado"
            value={settings.editableFields}
            onChange={(v) => update({ editableFields: v })}
          />
        </View>

        <Text style={styles.footer}>Mi Rutina · hecha para Yol con 💚</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  center: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  header: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  avatar: { fontSize: 48 },
  name: { color: theme.textColor, fontSize: 24, fontWeight: '800', marginTop: 8 },
  streak: { color: theme.warning, fontSize: 13, fontWeight: '700', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingVertical: 16,
    marginBottom: 24,
  },
  statBox: { flex: 1, alignItems: 'center' },
  statValue: { color: theme.timerColor, fontSize: 24, fontWeight: '800' },
  statLabel: { color: theme.textMuted, fontSize: 10, letterSpacing: 1, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: theme.borderColor, marginVertical: 4 },
  sectionTitle: {
    color: theme.textMuted, fontSize: 12, fontWeight: '700',
    letterSpacing: 2, marginBottom: 10,
  },
  settingsCard: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  toggleTexts: { flex: 1, marginRight: 12 },
  toggleLabel: { color: theme.textColor, fontSize: 15, fontWeight: '600' },
  toggleDescription: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  separator: { height: 1, backgroundColor: theme.borderColor },
  footer: { color: theme.textMuted, fontSize: 12, textAlign: 'center', marginTop: 24, opacity: 0.7 },
});
