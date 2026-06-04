import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Modal, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../constants/theme';
import { Exercise, Section } from '../types';

interface AddExerciseModalProps {
  visible: boolean;
  sections: Section[];
  onAdd: (sectionIndex: number, exercise: Exercise) => void;
  onClose: () => void;
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

export default function AddExerciseModal({ visible, sections, onAdd, onClose }: AddExerciseModalProps) {
  const [name, setName] = useState('');
  const [series, setSeries] = useState('1');
  const [reps, setReps] = useState('0');
  const [weight, setWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('30');
  const [workSeconds, setWorkSeconds] = useState('');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Mínimo 2 caracteres';
    if (name.trim().length > 100) e.name = 'Máximo 100 caracteres';
    const s = parseInt(series);
    if (isNaN(s) || s < 1) e.series = 'Mínimo 1';
    if (s > 20) e.series = 'Máximo 20';
    const r = parseInt(reps);
    if (reps && (isNaN(r) || r < 1)) e.reps = 'Mínimo 1';
    if (r > 100) e.reps = 'Máximo 100';
    const rest = parseInt(restSeconds);
    if (!isNaN(rest) && (rest < 0 || rest > 600)) e.rest = 'Entre 0 y 600 seg';
    return e;
  };

  const reset = () => {
    setName(''); setSeries('1'); setReps('0');
    setWeight(''); setRestSeconds('30'); setWorkSeconds('');
    setSectionIdx(0); setErrors({});
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const seriesNum = parseInt(series) || 1;
    const exercise: Exercise = {
      id: generateId(),
      name: name.trim(),
      series: seriesNum,
      reps,
      weight: weight || undefined,
      restSeconds: parseInt(restSeconds) || 0,
      workSeconds: workSeconds ? parseInt(workSeconds) : undefined,
      seriesCompleted: Array(seriesNum).fill(false),
      editable: true,
    };
    onAdd(sectionIdx, exercise);
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Agregar ejercicio</Text>
            <TouchableOpacity onPress={handleClose}>
              <Text style={styles.closeX}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.label}>Sección</Text>
            <View style={styles.sectionRow}>
              {sections.map((s, i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.sectionChip, sectionIdx === i && styles.sectionChipActive]}
                  onPress={() => setSectionIdx(i)}
                >
                  <Text style={[styles.sectionChipText, sectionIdx === i && styles.sectionChipTextActive]}>
                    {s.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Nombre *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((p) => ({ ...p, name: '' })); }}
              placeholder="ej: Sentadillas"
              placeholderTextColor={theme.textMuted}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Series *</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSeries(v => String(Math.max(1, (parseInt(v) || 1) - 1)))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.stepInput}
                    value={series}
                    onChangeText={(v) => { setSeries(v); setErrors((p) => ({ ...p, series: '' })); }}
                    inputMode="numeric"
                    textAlign="center"
                    placeholderTextColor={theme.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setSeries(v => String(Math.min(20, (parseInt(v) || 0) + 1)))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {errors.series ? <Text style={styles.errorText}>{errors.series}</Text> : null}
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Repeticiones</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setReps(v => String(Math.max(0, (parseInt(v) || 0) - 1)))}
                  >
                    <Text style={styles.stepBtnText}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.stepInput}
                    value={reps}
                    onChangeText={(v) => { setReps(v); setErrors((p) => ({ ...p, reps: '' })); }}
                    inputMode="numeric"
                    textAlign="center"
                    placeholder="0"
                    placeholderTextColor={theme.textMuted}
                  />
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setReps(v => String(Math.min(100, (parseInt(v) || 0) + 1)))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                {errors.reps ? <Text style={styles.errorText}>{errors.reps}</Text> : null}
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Peso</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="ej: 10 kg"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Pausa (0-600 seg)</Text>
                <TextInput
                  style={[styles.input, errors.rest && styles.inputError]}
                  value={restSeconds}
                  onChangeText={(v) => { setRestSeconds(v); setErrors((p) => ({ ...p, rest: '' })); }}
                  placeholder="60"
                  placeholderTextColor={theme.textMuted}
                />
                {errors.rest ? <Text style={styles.errorText}>{errors.rest}</Text> : null}
              </View>
            </View>

            <Text style={styles.label}>Tiempo de trabajo (seg) <Text style={styles.optional}>— opcional, para planchas</Text></Text>
            <TextInput
              style={styles.input}
              value={workSeconds}
              onChangeText={setWorkSeconds}
              keyboardType="numeric"
              placeholder="ej: 30"
              placeholderTextColor={theme.textMuted}
            />

            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>AGREGAR</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '700',
  },
  closeX: {
    color: theme.textMuted,
    fontSize: 18,
    padding: 4,
  },
  label: {
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  optional: {
    fontSize: 10,
    fontWeight: '400',
  },
  sectionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  sectionChip: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  sectionChipActive: {
    backgroundColor: theme.timerColor,
    borderColor: theme.timerColor,
  },
  sectionChipText: {
    color: theme.textMuted,
    fontSize: 12,
  },
  sectionChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  input: {
    backgroundColor: theme.sectionBackground,
    borderRadius: 10,
    padding: 12,
    color: theme.textColor,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  inputError: {
    borderColor: '#FF4444',
  },
  errorText: {
    color: '#FF4444',
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  addBtn: {
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  addBtnText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.sectionBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    overflow: 'hidden',
  },
  stepBtn: {
    width: 44,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.borderColor,
  },
  stepBtnText: {
    color: theme.textColor,
    fontSize: 22,
    fontWeight: '600',
  },
  stepInput: {
    flex: 1,
    height: 48,
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
});
