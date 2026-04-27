import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, TextInput,
  StyleSheet, Vibration, Alert,
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
  const [editingField, setEditingField] = useState<string | null>(null);
  const allDone = exercise.seriesCompleted.every(Boolean);

  const handleCheck = (index: number) => {
    if (vibrationOnCheck) Vibration.vibrate(50);
    onToggleSeries(index);
    if (!exercise.seriesCompleted[index] && autoStartTimer && (exercise.restSeconds > 0 || exercise.workSeconds)) {
      onTimerStart(exercise.restSeconds, exercise.workSeconds);
    }
  };

  const handleSeriesChange = (value: string) => {
    onEdit('series' as keyof Exercise, value);
    const n = parseInt(value);
    if (!isNaN(n) && n > 0) {
      onEdit('seriesCompleted' as keyof Exercise, JSON.stringify(Array(n).fill(false)));
    }
  };

  const renderField = (
    field: string,
    value: string,
    style: object,
    placeholder: string,
    onChangeFn?: (v: string) => void
  ) => {
    if (!editable) return <Text style={style}>{value || placeholder}</Text>;

    if (editingField === field) {
      return (
        <TextInput
          style={[style, styles.inlineInput]}
          value={value}
          onChangeText={onChangeFn || ((v) => onEdit(field as keyof Exercise, v))}
          onBlur={() => setEditingField(null)}
          autoFocus
          selectTextOnFocus
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
        />
      );
    }

    return (
      <TouchableOpacity onPress={() => setEditingField(field)}>
        <Text style={[style, allDone && field === 'name' && styles.strikeText]}>
          {value || <Text style={styles.placeholder}>{placeholder}</Text>}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.card, allDone && styles.cardDone]}>
      <View style={styles.topRow}>
        <View style={styles.nameContainer}>
          {renderField('name', exercise.name, styles.name, 'Ejercicio')}

          <View style={styles.metaRow}>
            {renderField('reps', exercise.reps, styles.meta, 'reps')}
            <Text style={styles.metaSep}>·</Text>
            {renderField('weight', exercise.weight ?? '', styles.meta, 'peso')}
            <Text style={styles.metaSep}>·</Text>
            {renderField(
              'series',
              String(exercise.series),
              styles.meta,
              'series',
              handleSeriesChange
            )}
            <Text style={styles.meta}> series</Text>
            {exercise.restSeconds > 0 && (
              <>
                <Text style={styles.metaSep}>·</Text>
                {renderField('restSeconds', String(exercise.restSeconds), styles.meta, '0')}
                <Text style={styles.meta}>s pausa</Text>
              </>
            )}
          </View>
        </View>

        <View style={styles.rightCol}>
          {editable && (
            <View style={styles.actions}>
              {onDuplicate && (
                <TouchableOpacity onPress={onDuplicate} style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>⧉</Text>
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  onPress={() => Alert.alert('Eliminar', `¿Eliminar "${exercise.name}"?`, [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Eliminar', style: 'destructive', onPress: onDelete },
                  ])}
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
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
  cardDone: { opacity: 0.4 },
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
  strikeText: {
    textDecorationLine: 'line-through',
    color: theme.strikeColor,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 2,
  },
  meta: {
    color: theme.textMuted,
    fontSize: theme.fontSize.small,
  },
  metaSep: {
    color: theme.borderColor,
    fontSize: theme.fontSize.small,
    marginHorizontal: 3,
  },
  placeholder: {
    color: theme.checkboxInactive,
    fontStyle: 'italic',
  },
  inlineInput: {
    borderBottomWidth: 1,
    borderBottomColor: theme.timerColor,
    paddingVertical: 1,
    minWidth: 40,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  actionBtnText: {
    color: theme.textMuted,
    fontSize: 13,
  },
  deleteBtn: {
    borderColor: theme.danger,
  },
  deleteBtnText: {
    color: theme.danger,
    fontSize: 12,
    fontWeight: '700',
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
});
