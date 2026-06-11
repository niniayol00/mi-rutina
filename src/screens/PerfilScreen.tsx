import React, { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Switch, ActivityIndicator,
  TextInput, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../constants/theme';
import { AppSettings } from '../types';
import { loadSettings, saveSettings } from '../utils/storage';

const APP_VERSION = '1.0.0';

interface ToggleRowProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, description, value, onChange }: ToggleRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTexts}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
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

  const load = useCallback(async () => {
    const s = await loadSettings();
    setSettings(s);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const update = async (patch: Partial<AppSettings>) => {
    if (!settings) return;
    const updated = { ...settings, ...patch };
    setSettings(updated);
    await saveSettings(updated);
  };

  const exportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const pairs = await AsyncStorage.multiGet(keys);
      const data: Record<string, unknown> = {};
      pairs.forEach(([k, v]) => {
        try { data[k] = v ? JSON.parse(v) : null; } catch { data[k] = v; }
      });
      const json = JSON.stringify(data, null, 2);
      if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mi-rutina-datos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        Alert.alert('Exportar datos', 'La exportación está disponible en la versión web.');
      }
    } catch {
      if (Platform.OS === 'web') window.alert('No se pudieron exportar los datos.');
    }
  };

  const clearData = () => {
    const msg = 'Se van a borrar TODAS tus rutinas, historial y configuración. Esta acción no se puede deshacer. ¿Continuar?';
    const doClear = async () => {
      await AsyncStorage.clear();
      if (Platform.OS === 'web') window.location.reload();
      else load();
    };
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) doClear();
    } else {
      Alert.alert('Borrar datos', msg, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar todo', style: 'destructive', onPress: doClear },
      ]);
    }
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
          <Text style={styles.title}>Perfil</Text>
        </View>

        <Text style={styles.sectionTitle}>DATOS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowTexts}>
              <Text style={styles.rowLabel}>Tu nombre</Text>
              <Text style={styles.rowDescription}>Se usa en los mensajes de la app</Text>
            </View>
            <TextInput
              style={styles.nameInput}
              value={settings.userName ?? ''}
              onChangeText={(v) => update({ userName: v })}
              placeholder="Tu nombre"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>PREFERENCIAS</Text>
        <View style={styles.card}>
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

        <Text style={styles.sectionTitle}>DATOS DE LA APP</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.row} onPress={exportData}>
            <View style={styles.rowTexts}>
              <Text style={styles.rowLabel}>Exportar datos</Text>
              <Text style={styles.rowDescription}>Descarga un respaldo de tus rutinas e historial</Text>
            </View>
            <Text style={styles.rowAction}>↓</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
          <TouchableOpacity style={styles.row} onPress={clearData}>
            <View style={styles.rowTexts}>
              <Text style={[styles.rowLabel, { color: theme.danger }]}>Borrar datos</Text>
              <Text style={styles.rowDescription}>Elimina todo y empieza de cero</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.separator} />
          <View style={styles.row}>
            <View style={styles.rowTexts}>
              <Text style={styles.rowLabel}>Versión</Text>
            </View>
            <Text style={styles.rowValue}>{APP_VERSION}</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.backgroundColor },
  center: { flex: 1, backgroundColor: theme.backgroundColor, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: 20 },
  header: { paddingTop: 20, paddingBottom: 16 },
  title: { color: theme.textColor, fontSize: 24, fontWeight: '700' },
  sectionTitle: {
    color: theme.textMuted, fontSize: 12, fontWeight: '700',
    letterSpacing: 2, marginBottom: 10, marginTop: 8,
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.borderColor,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingVertical: 14,
  },
  rowTexts: { flex: 1, marginRight: 12 },
  rowLabel: { color: theme.textColor, fontSize: 15, fontWeight: '600' },
  rowDescription: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  rowAction: { color: theme.timerColor, fontSize: 18, fontWeight: '700' },
  rowValue: { color: theme.textMuted, fontSize: 14 },
  nameInput: {
    color: theme.textColor,
    fontSize: 15,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
    paddingVertical: 4,
    minWidth: 100,
    textAlign: 'right',
  },
  separator: { height: 1, backgroundColor: theme.borderColor },
});
