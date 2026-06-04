import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Exercise, Section } from '../types';
import ExerciseCard from './ExerciseCard';
import { theme } from '../constants/theme';

interface Props {
  section: Section;
  sectionIdx: number;
  editable: boolean;
  vibrationOnCheck: boolean;
  autoStartTimer: boolean;
  weightHistory: Record<string, string>;
  onToggleSeries: (ei: number, si: number) => void;
  onEdit: (ei: number, field: string, value: string) => void;
  onSaveAll: (ei: number, updated: Exercise) => void;
  onTimerStart: (seconds: number, workSeconds?: number) => void;
  onReorder: (fromIdx: number, toIdx: number) => void;
  onDuplicate: (exerciseIdx: number) => void;
  onDelete: (exerciseIdx: number) => void;
}

export default function DraggableExerciseList({
  section, sectionIdx, editable, vibrationOnCheck,
  autoStartTimer, weightHistory, onToggleSeries, onEdit, onSaveAll, onTimerStart, onReorder,
  onDuplicate, onDelete,
}: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  if (Platform.OS !== 'web') {
    return (
      <>
        {section.exercises.map((exercise, ei) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            editable={editable}
            vibrationOnCheck={vibrationOnCheck}
            autoStartTimer={autoStartTimer}
            previousWeight={weightHistory[exercise.name.toLowerCase().trim()]}
            onToggleSeries={(si) => onToggleSeries(ei, si)}
            onEdit={(field, value) => onEdit(ei, field as string, value)}
            onSaveAll={(updated) => onSaveAll(ei, updated)}
            onTimerStart={onTimerStart}
          />
        ))}
      </>
    );
  }

  // Web drag-and-drop
  const handleDragStart = (e: any, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: any, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setOverIdx(idx);
  };

  const handleDrop = (e: any, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      onReorder(dragIdx, idx);
    }
    setDragIdx(null);
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    setDragIdx(null);
    setOverIdx(null);
  };

  return (
    <>
      {section.exercises.map((exercise, ei) => (
        <div
          key={exercise.id}
          draggable
          onDragStart={(e) => handleDragStart(e, ei)}
          onDragOver={(e) => handleDragOver(e, ei)}
          onDrop={(e) => handleDrop(e, ei)}
          onDragEnd={handleDragEnd}
          style={{
            opacity: dragIdx === ei ? 0.4 : 1,
            borderTop: overIdx === ei && dragIdx !== ei ? `2px solid ${theme.timerColor}` : '2px solid transparent',
            transition: 'opacity 0.15s, border-color 0.1s',
            cursor: 'grab',
          }}
        >
          <View style={styles.row}>
            <View style={styles.handle}>
              <Text style={styles.handleText}>⠿</Text>
            </View>
            <View style={{ flex: 1 }}>
              <ExerciseCard
                exercise={exercise}
                editable={editable}
                vibrationOnCheck={vibrationOnCheck}
                autoStartTimer={autoStartTimer}
                previousWeight={weightHistory[exercise.name.toLowerCase().trim()]}
                onToggleSeries={(si) => onToggleSeries(ei, si)}
                onEdit={(field, value) => onEdit(ei, field as string, value)}
                onSaveAll={(updated) => onSaveAll(ei, updated)}
                onTimerStart={onTimerStart}
                onDuplicate={() => onDuplicate(ei)}
                onDelete={() => onDelete(ei)}
              />
            </View>
          </View>
        </div>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  handle: {
    paddingHorizontal: 6,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleText: {
    color: theme.textMuted,
    fontSize: 18,
  },
});
