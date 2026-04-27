import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../constants/theme';
import { parseRoutineText } from '../utils/parser';
import { loadRoutine, saveRoutine } from '../utils/storage';
import { Section, Exercise } from '../types';

export default function InputScreen() {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<Section[] | null>(null);
  const [routineName, setRoutineName] = useState('Mi Rutina');
  const [step, setStep] = useState<'input' | 'preview'>('input');

  const handleParse = () => {
    if (!text.trim()) {
      Alert.alert('Campo vacío', 'Pegá tu rutina para continuar.');
      return;
    }
    const sections = parseRoutineText(text);
    setPreview(sections);
    setStep('preview');
  };

  const handleSave = async () => {
    if (!preview) return;
    const existing = await loadRoutine();
    const newRoutine = {
      ...existing,
      name: routineName,
      sections: preview,
    };
    await saveRoutine(newRoutine);
    router.replace('/');
  };

  const totalExercises = preview?.reduce((acc, s) => acc + s.exercises.length, 0) ?? 0;

  if (step === 'preview' && preview) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStep('input')} style={styles.backBtn}>
            <Text style={styles.backText}>← Editar</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Vista previa</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>GUARDAR</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.nameInput}
          value={routineName}
          onChangeText={setRoutineName}
          placeholder="Nombre de la rutina"
          placeholderTextColor={theme.textMuted}
        />

        <Text style={styles.summary}>
          {preview.length} secciones · {totalExercises} ejercicios detectados
        </Text>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {preview.map((section, si) => (
            <View key={si} style={styles.section}>
              <Text style={styles.sectionName}>{section.name.toUpperCase()}</Text>
              {section.exercises.map((ex, ei) => (
                <View key={ei} style={styles.exerciseRow}>
                  <Text style={styles.exerciseName}>{ex.name}</Text>
                  <View style={styles.exerciseMeta}>
                    {ex.series > 1 && (
                      <Text style={styles.tag}>{ex.series}x</Text>
                    )}
                    {ex.reps ? <Text style={styles.tag}>{ex.reps}</Text> : null}
                    {ex.weight ? <Text style={styles.tag}>{ex.weight}</Text> : null}
                    {ex.restSeconds > 0 && (
                      <Text style={styles.tag}>{ex.restSeconds}s</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pegar rutina</Text>
        <View style={{ width: 70 }} />
      </View>

      <Text style={styles.description}>
        Pegá tu rutina completa. La app detectará ejercicios, series, repeticiones y pausas automáticamente.
      </Text>

      <TextInput
        style={styles.textArea}
        value={text}
        onChangeText={setText}
        placeholder={`Ejemplo:\nMOVILIDAD:\nPlancha alta 3x30"\nABDOMINALES:\nAbdominales concentrados 3x10 pausa 30`}
        placeholderTextColor={theme.textMuted}
        multiline
        textAlignVertical="top"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={[styles.parseBtn, !text.trim() && styles.parseBtnDisabled]}
        onPress={handleParse}
        disabled={!text.trim()}
      >
        <Text style={styles.parseBtnText}>GENERAR RUTINA</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 70,
  },
  backText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  title: {
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: theme.textMuted,
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 16,
    lineHeight: 20,
  },
  textArea: {
    flex: 1,
    margin: 16,
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 16,
    color: theme.textColor,
    fontSize: 14,
    lineHeight: 22,
    borderWidth: 1,
    borderColor: theme.borderColor,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  parseBtn: {
    margin: 16,
    marginTop: 8,
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  parseBtnDisabled: {
    opacity: 0.3,
  },
  parseBtnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  nameInput: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    padding: 12,
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.accentColor,
  },
  summary: {
    color: theme.textMuted,
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionName: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  exerciseRow: {
    backgroundColor: theme.cardBackground,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  exerciseName: {
    color: theme.textColor,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    color: theme.textMuted,
    fontSize: 12,
    backgroundColor: theme.borderColor,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  saveBtn: {
    width: 70,
    alignItems: 'flex-end',
  },
  saveBtnText: {
    color: theme.timerColor,
    fontSize: 13,
    fontWeight: '700',
  },
});
