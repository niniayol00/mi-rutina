import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Vibration,
} from 'react-native';
import { Exercise } from '../types';
import { theme } from '../constants/theme';

interface ExerciseCardProps {
  exercise: Exercise;
  editable: boolean;
  vibrationOnCheck: boolean;
  onToggleSeries: (seriesIndex: number) => void;
  onEdit: (field: keyof Exercise, value: string) => void;
  onSaveAll: (updated: Exercise) => void;
  onTimerStart: (seconds: number, workSeconds?: number) => void;
  autoStartTimer: boolean;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

export default function ExerciseCard({
  exercise,
  editable,
  vibrationOnCheck,
  onToggleSeries,
  onEdit,
  onSaveAll,
  onTimerStart,
  autoStartTimer,
  onDuplicate,
  onDelete,
}: ExerciseCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Estado local para edición — se inicializa cuando se abre el popup
  const [localName, setLocalName] = useState('');
  const [localSeries, setLocalSeries] = useState('');
  const [localReps, setLocalReps] = useState('');
  const [localWeight, setLocalWeight] = useState('');
  const [localRest, setLocalRest] = useState('');

  const allDone = exercise.seriesCompleted.every(Boolean);

  const openEdit = () => {
    setLocalName(exercise.name);
    setLocalSeries(String(exercise.series));
    setLocalReps(exercise.reps);
    setLocalWeight(exercise.weight ?? '');
    setLocalRest(String(exercise.restSeconds));
    setConfirmingDelete(false);
    setEditMode(true);
  };

  const saveAndClose = () => {
    const seriesNum = Math.max(1, parseInt(localSeries) || 1);
    const updatedExercise: Exercise = {
      ...exercise,
      name: localName.trim() || exercise.name,
      reps: localReps,
      weight: localWeight || undefined,
      restSeconds: parseInt(localRest) || 0,
      series: seriesNum,
      seriesCompleted: seriesNum !== exercise.series
        ? Array(seriesNum).fill(false)
        : exercise.seriesCompleted,
    };
    onSaveAll(updatedExercise);
    setEditMode(false);
  };

  const handleCheck = (index: number) => {
    if (vibrationOnCheck) Vibration.vibrate(50);
    onToggleSeries(index);
    if (!exercise.seriesCompleted[index] && autoStartTimer && (exercise.restSeconds > 0 || exercise.workSeconds)) {
      onTimerStart(exercise.restSeconds, exercise.workSeconds);
    }
  };

  if (editMode) {
    return (
      <View style={[styles.card, styles.cardEditing]}>
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>EDITAR EJERCICIO</Text>
          <View style={styles.editHeaderActions}>
            {onDuplicate && (
              <TouchableOpacity onPress={() => { setEditMode(false); onDuplicate(); }} style={styles.dupBtn}>
                <Text style={styles.dupBtnText}>⧉ Duplicar</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              confirmingDelete ? (
                <View style={styles.confirmRow}>
                  <Text style={styles.confirmText}>¿Eliminar?</Text>
                  <TouchableOpacity onPress={() => { setConfirmingDelete(false); setEditMode(false); onDelete!(); }} style={styles.confirmYes}>
                    <Text style={styles.confirmYesText}>Sí</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setConfirmingDelete(false)} style={styles.confirmNo}>
                    <Text style={styles.confirmNoText}>No</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity onPress={() => setConfirmingDelete(true)} style={styles.delBtn}>
                  <Text style={styles.delBtnText}>🗑️</Text>
                </TouchableOpacity>
              )
            )}
            <TouchableOpacity onPress={saveAndClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>LISTO ✓</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.fieldInput}
            value={localName}
            onChangeText={setLocalName}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Series</Text>
            <TextInput
              style={styles.fieldInput}
              value={localSeries}
              onChangeText={setLocalSeries}
              placeholder="3"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Repeticiones</Text>
            <TextInput
              style={styles.fieldInput}
              value={localReps}
              onChangeText={setLocalReps}
              placeholder="12"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Peso</Text>
            <TextInput
              style={styles.fieldInput}
              value={localWeight}
              onChangeText={setLocalWeight}
              placeholder="ej: 10 kg"
              placeholderTextColor={theme.textMuted}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Pausa (segundos)</Text>
            <TextInput
              style={styles.fieldInput}
              value={localRest}
              onChangeText={setLocalRest}
              placeholder="30"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, allDone && styles.cardDone]}
      onPress={() => editable && openEdit()}
      activeOpacity={editable ? 0.7 : 1}
    >
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <Text style={[styles.name, allDone && styles.strikeText]}>{exercise.name}</Text>
          <View style={styles.metaRow}>
            {exercise.reps ? <Text style={styles.meta}>{exercise.reps}</Text> : null}
            {exercise.weight ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.meta}>{exercise.weight}</Text>
              </>
            ) : null}
            {exercise.restSeconds > 0 && (
              <>
                <Text style={styles.metaSep}>·</Text>
                <Text style={styles.meta}>{exercise.restSeconds}s pausa</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.seriesRow}>
          {exercise.seriesCompleted.map((done, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.checkbox, done && styles.checkboxDone]}
              onPress={(e) => { e.stopPropagation?.(); handleCheck(i); }}
              activeOpacity={0.7}
            >
              {done && <Text style={styles.checkMark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  cardDone: { opacity: 0.4 },
  cardEditing: { borderColor: theme.timerColor },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameContainer: { flex: 1 },
  name: {
    color: theme.textColor,
    fontSize: theme.fontSize.exercise,
    fontWeight: '500',
    lineHeight: 24,
  },
  strikeText: { textDecorationLine: 'line-through', color: theme.strikeColor },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  meta: { color: theme.textMuted, fontSize: theme.fontSize.small },
  metaSep: { color: theme.borderColor, fontSize: theme.fontSize.small, marginHorizontal: 4 },
  seriesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  checkbox: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 2, borderColor: theme.checkboxInactive,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone: { backgroundColor: theme.checkboxActive, borderColor: theme.checkboxActive },
  checkMark: { color: '#000', fontSize: 16, fontWeight: '800' },

  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8,
  },
  editHeaderActions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  editTitle: { color: theme.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  doneBtn: {
    backgroundColor: theme.timerColor,
    borderRadius: 8, paddingHorizontal: 14, paddingVertical: 6,
  },
  doneBtnText: { color: '#000', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dupBtn: {
    borderWidth: 1, borderColor: theme.borderColor,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  dupBtnText: { color: theme.textMuted, fontSize: 12 },
  delBtn: {
    borderWidth: 1, borderColor: theme.danger,
    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
  },
  delBtnText: { fontSize: 15 },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  confirmText: { color: theme.danger, fontSize: 12, fontWeight: '600' },
  confirmYes: {
    backgroundColor: theme.danger, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  confirmYesText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  confirmNo: {
    borderWidth: 1, borderColor: theme.borderColor,
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
  },
  confirmNoText: { color: theme.textMuted, fontSize: 12 },
  fieldGroup: { marginBottom: 12 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: {
    color: theme.textMuted, fontSize: 11,
    letterSpacing: 1, marginBottom: 6, fontWeight: '600',
  },
  fieldInput: {
    backgroundColor: theme.sectionBackground,
    borderRadius: 8, padding: 10,
    color: theme.textColor, fontSize: 15,
    borderWidth: 1, borderColor: theme.borderColor,
  },
});
