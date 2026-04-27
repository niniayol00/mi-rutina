import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Vibration,
  Alert,
} from 'react-native';
import { Exercise } from '../types';
import { theme } from '../constants/theme';

interface ExerciseCardProps {
  exercise: Exercise;
  editable: boolean;
  vibrationOnCheck: boolean;
  onToggleSeries: (seriesIndex: number) => void;
  onEdit: (field: keyof Exercise, value: string) => void;
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
  onTimerStart,
  autoStartTimer,
  onDuplicate,
  onDelete,
}: ExerciseCardProps) {
  const [editMode, setEditMode] = useState(false);
  const allDone = exercise.seriesCompleted.every(Boolean);

  const handleCheck = (index: number) => {
    if (vibrationOnCheck) Vibration.vibrate(50);
    onToggleSeries(index);
    if (!exercise.seriesCompleted[index] && autoStartTimer && (exercise.restSeconds > 0 || exercise.workSeconds)) {
      onTimerStart(exercise.restSeconds, exercise.workSeconds);
    }
  };

  const handleSeriesChange = (value: string) => {
    const n = parseInt(value);
    if (!isNaN(n) && n > 0) {
      onEdit('series' as keyof Exercise, value);
      onEdit('seriesCompleted' as keyof Exercise, JSON.stringify(Array(n).fill(false)));
    }
  };

  if (editMode) {
    return (
      <View style={[styles.card, styles.cardEditing]}>
        <View style={styles.editHeader}>
          <Text style={styles.editTitle}>Editar ejercicio</Text>
          <View style={styles.editActions}>
            {onDuplicate && (
              <TouchableOpacity onPress={() => { setEditMode(false); onDuplicate(); }} style={styles.dupBtn}>
                <Text style={styles.dupBtnText}>⧉</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                onPress={() => Alert.alert('Eliminar', `¿Eliminar "${exercise.name}"?`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => { setEditMode(false); onDelete!(); } },
                ])}
                style={styles.delBtn}
              >
                <Text style={styles.delBtnText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setEditMode(false)} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>LISTO ✓</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Nombre</Text>
          <TextInput
            style={styles.fieldInput}
            value={exercise.name}
            onChangeText={(v) => onEdit('name', v)}
            placeholder="Nombre del ejercicio"
            placeholderTextColor={theme.textMuted}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Series</Text>
            <TextInput
              style={styles.fieldInput}
              value={String(exercise.series)}
              onChangeText={handleSeriesChange}
              keyboardType="numeric"
              placeholder="3"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Repeticiones</Text>
            <TextInput
              style={styles.fieldInput}
              value={exercise.reps}
              onChangeText={(v) => onEdit('reps', v)}
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
              value={exercise.weight ?? ''}
              onChangeText={(v) => onEdit('weight', v)}
              placeholder="ej: 10 kg"
              placeholderTextColor={theme.textMuted}
            />
          </View>

          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.fieldLabel}>Pausa (segundos)</Text>
            <TextInput
              style={styles.fieldInput}
              value={String(exercise.restSeconds)}
              onChangeText={(v) => onEdit('restSeconds', v)}
              keyboardType="numeric"
              placeholder="30"
              placeholderTextColor={theme.textMuted}
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.card, allDone && styles.cardDone]}>
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

        <View style={styles.rightCol}>
          {editable && (
            <TouchableOpacity onPress={() => setEditMode(true)} style={styles.editBtn}>
              <Text style={styles.editBtnText}>✏️</Text>
            </TouchableOpacity>
          )}
          <View style={styles.seriesRow}>
            {exercise.seriesCompleted.map((done, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.checkbox, done && styles.checkboxDone]}
                onPress={() => handleCheck(i)}
                activeOpacity={0.7}
              >
                {done && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
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
  cardDone: {
    opacity: 0.4,
  },
  cardEditing: {
    borderColor: theme.accentColor,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  nameContainer: {
    flex: 1,
  },
  name: {
    color: theme.textColor,
    fontSize: theme.fontSize.exercise,
    fontWeight: '500',
    lineHeight: 24,
  },
  strikeText: {
    textDecorationLine: 'line-through',
    color: theme.strikeColor,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  meta: {
    color: theme.textMuted,
    fontSize: theme.fontSize.small,
  },
  metaSep: {
    color: theme.borderColor,
    fontSize: theme.fontSize.small,
    marginHorizontal: 4,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  editBtn: {
    padding: 4,
  },
  editBtnText: {
    fontSize: 16,
  },
  seriesRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.checkboxInactive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: theme.checkboxActive,
    borderColor: theme.checkboxActive,
  },
  checkMark: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  editHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  editTitle: {
    color: theme.textMuted,
    fontSize: 12,
    letterSpacing: 2,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: theme.accentColor,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  doneBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  dupBtn: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dupBtnText: {
    color: theme.textMuted,
    fontSize: 14,
  },
  delBtn: {
    borderWidth: 1,
    borderColor: theme.danger,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  delBtnText: {
    color: theme.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldLabel: {
    color: theme.textMuted,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '600',
  },
  fieldInput: {
    backgroundColor: theme.sectionBackground,
    borderRadius: 8,
    padding: 10,
    color: theme.textColor,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
});
