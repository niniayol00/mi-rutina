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
  const [series, setSeries] = useState('3');
  const [reps, setReps] = useState('12');
  const [weight, setWeight] = useState('');
  const [restSeconds, setRestSeconds] = useState('30');
  const [workSeconds, setWorkSeconds] = useState('');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [error, setError] = useState('');

  const reset = () => {
    setName(''); setSeries('3'); setReps('12');
    setWeight(''); setRestSeconds('30'); setWorkSeconds('');
    setSectionIdx(0); setError('');
  };

  const handleAdd = () => {
    if (!name.trim()) { setError('El nombre es obligatorio'); return; }
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
              style={[styles.input, error && !name.trim() && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setError(''); }}
              placeholder="ej: Sentadillas"
              placeholderTextColor={theme.textMuted}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.row}>
              <View style={styles.half}>
                <Text style={styles.label}>Series</Text>
                <TextInput
                  style={styles.input}
                  value={series}
                  onChangeText={setSeries}
                  inputMode="numeric"
                  placeholder="3"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={styles.half}>
                <Text style={styles.label}>Repeticiones</Text>
                <TextInput
                  style={styles.input}
                  value={reps}
                  onChangeText={setReps}
                  placeholder="12"
                  placeholderTextColor={theme.textMuted}
                />
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
                <Text style={styles.label}>Pausa (seg)</Text>
                <TextInput
                  style={styles.input}
                  value={restSeconds}
                  onChangeText={setRestSeconds}
                  inputMode="numeric"
                  placeholder="30"
                  placeholderTextColor={theme.textMuted}
                />
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
});
