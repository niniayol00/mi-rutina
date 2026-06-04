import React, { memo, useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Vibration, Platform,
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

const ExerciseCard = memo(function ExerciseCard({
  exercise, editable, vibrationOnCheck,
  onToggleSeries, onEdit, onSaveAll,
  onTimerStart, autoStartTimer, onDuplicate, onDelete,
}: ExerciseCardProps) {
  const [editMode, setEditMode] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [localName, setLocalName] = useState('');
  const [localSeries, setLocalSeries] = useState('');
  const [localReps, setLocalReps] = useState('');
  const [localWeight, setLocalWeight] = useState('');
  const [localRest, setLocalRest] = useState('');
  const [localRetention, setLocalRetention] = useState('');

  const allDone = exercise.seriesCompleted.every(Boolean);

  const openEdit = () => {
    setLocalName(exercise.name);
    setLocalSeries(String(Math.max(1, exercise.series || 1)));
    setLocalReps(String(Math.max(1, parseInt(exercise.reps) || 1)));
    setLocalWeight(exercise.weight ?? '');
    setLocalRest(String(exercise.restSeconds));
    setLocalRetention(exercise.workSeconds ? String(exercise.workSeconds) : '');
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
      workSeconds: localRetention ? (parseInt(localRetention) || undefined) : undefined,
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

  // ─── Edit panel ────────────────────────────────────────────────
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
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Series</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setLocalSeries(v => String(Math.max(1, (parseInt(v) || 1) - 1)))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueWrap}>
                <Text style={styles.stepValue}>{localSeries}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setLocalSeries(v => String(Math.min(20, (parseInt(v) || 1) + 1)))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Repeticiones</Text>
            <View style={styles.stepper}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setLocalReps(v => String(Math.max(1, (parseInt(v) || 1) - 1)))}
              >
                <Text style={styles.stepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.stepValueWrap}>
                <Text style={styles.stepValue}>{localReps}</Text>
              </View>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() => setLocalReps(v => String(Math.min(100, (parseInt(v) || 0) + 1)))}
              >
                <Text style={styles.stepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Peso 💪</Text>
            <TextInput
              style={[styles.fieldInput, styles.fieldInputAccent]}
              value={localWeight}
              onChangeText={setLocalWeight}
              placeholder="ej: 10 kg"
              placeholderTextColor={theme.textMuted}
              inputMode="decimal"
              returnKeyType="next"
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Pausa (seg)</Text>
            <TextInput
              style={styles.fieldInput}
              value={localRest}
              onChangeText={setLocalRest}
              placeholder="30"
              placeholderTextColor={theme.textMuted}
              inputMode="numeric"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Retención (seg) — opcional</Text>
            <TextInput
              style={styles.fieldInput}
              value={localRetention}
              onChangeText={setLocalRetention}
              placeholder="ej: 30"
              placeholderTextColor={theme.textMuted}
              inputMode="numeric"
              returnKeyType="done"
              onSubmitEditing={saveAndClose}
            />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]} />
        </View>
      </View>
    );
  }

  // ─── Display card ──────────────────────────────────────────────
  return (
    <View style={[styles.card, allDone && styles.cardDone]}>
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          <TouchableOpacity
            onPress={() => editable && openEdit()}
            activeOpacity={editable ? 0.6 : 1}
            disabled={!editable}
          >
            <View style={editable ? styles.editableField : undefined}>
              <Text style={[styles.name, allDone && styles.strikeText]}>{exercise.name}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.metaRow}>
            {exercise.workSeconds ? (
              <Text style={styles.meta}>{exercise.workSeconds}seg retención</Text>
            ) : exercise.reps ? (
              <Text style={styles.meta}>{exercise.reps} repeticiones</Text>
            ) : null}

            {exercise.weight ? (
              <>
                <Text style={styles.metaSep}>·</Text>
                <View style={[styles.weightBadge, allDone && styles.weightBadgeDone]}>
                  <Text style={[styles.weightText, allDone && styles.weightTextDone]}>
                    {exercise.weight}
                  </Text>
                </View>
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
    </View>
  );
});

export default ExerciseCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  cardDone: { opacity: 0.35 },
  cardEditing: { borderColor: theme.timerColor, borderWidth: 1.5 },
  topRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
  },
  nameContainer: { flex: 1 },
  editableField: {
    borderBottomWidth: 1,
    borderBottomColor: theme.borderColor,
    borderStyle: 'dashed',
    paddingBottom: 2,
    marginBottom: 2,
  },
  name: {
    color: theme.textColor,
    fontSize: theme.fontSize.exercise,
    fontWeight: '600',
    lineHeight: 24,
  },
  strikeText: { textDecorationLine: 'line-through', color: theme.strikeColor },
  metaRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 6, flexWrap: 'wrap', gap: 2,
  },
  meta: { color: theme.textMuted, fontSize: theme.fontSize.small },
  metaSep: { color: theme.borderColor, fontSize: theme.fontSize.small, marginHorizontal: 4 },
  weightBadge: {
    backgroundColor: theme.borderColor,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  weightBadgeDone: { backgroundColor: 'transparent' },
  weightText: { color: theme.timerColor, fontSize: 12, fontWeight: '700' },
  weightTextDone: { color: theme.strikeColor },
  editHint: {
    color: theme.checkboxInactive,
    fontSize: 10,
    marginTop: 6,
    letterSpacing: 0.5,
  },
  seriesRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  checkbox: {
    width: 36, height: 36, borderRadius: 8,
    borderWidth: 2, borderColor: theme.checkboxInactive,
    justifyContent: 'center', alignItems: 'center',
  },
  checkboxDone: { backgroundColor: theme.timerColor, borderColor: theme.timerColor },
  checkMark: { color: '#000', fontSize: 16, fontWeight: '800' },

  // Edit panel
  editHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8,
  },
  editHeaderActions: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  editTitle: { color: theme.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  doneBtn: {
    backgroundColor: theme.timerColor, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 6,
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
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.borderColor,
    overflow: 'hidden',
    height: 44,
  },
  stepBtn: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.borderColor,
  },
  stepBtnText: {
    color: theme.textColor,
    fontSize: 22,
    fontWeight: '600',
  },
  stepValueWrap: {
    flex: 2,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.sectionBackground,
  },
  stepValue: {
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stepInput: {
    flex: 1,
    height: 44,
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  fieldRow: { flexDirection: 'row', gap: 12 },
  fieldLabel: {
    color: theme.textMuted, fontSize: 11,
    letterSpacing: 1, marginBottom: 6, fontWeight: '600',
  },
  fieldInput: {
    backgroundColor: theme.sectionBackground, borderRadius: 8, padding: 12,
    color: theme.textColor, fontSize: 15,
    borderWidth: 1, borderColor: theme.borderColor,
  },
  fieldInputAccent: {
    borderColor: theme.timerColor,
    borderWidth: 1.5,
  },
});
