import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, PanResponder, Animated } from 'react-native';
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

// ─── Mobile drag item ──────────────────────────────────────────────
function DraggableItem({
  exercise, ei, editable, vibrationOnCheck, autoStartTimer,
  weightHistory, onToggleSeries, onEdit, onSaveAll, onTimerStart,
  onDuplicate, onDelete, onReorder, totalItems,
}: {
  exercise: Exercise; ei: number; editable: boolean;
  vibrationOnCheck: boolean; autoStartTimer: boolean;
  weightHistory: Record<string, string>;
  onToggleSeries: (si: number) => void;
  onEdit: (field: string, value: string) => void;
  onSaveAll: (updated: Exercise) => void;
  onTimerStart: (s: number, ws?: number) => void;
  onDuplicate: () => void; onDelete: () => void;
  onReorder: (from: number, to: number) => void;
  totalItems: number;
}) {
  const pan = useRef(new Animated.ValueXY()).current;
  const dragging = useRef(false);
  const startY = useRef(0);
  const ITEM_HEIGHT = 100;

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dy) > 8 && Math.abs(gs.dy) > Math.abs(gs.dx),
    onPanResponderGrant: (e) => {
      dragging.current = true;
      startY.current = e.nativeEvent.pageY;
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: (_, gs) => {
      pan.setValue({ x: 0, y: gs.dy });
    },
    onPanResponderRelease: (_, gs) => {
      dragging.current = false;
      const steps = Math.round(gs.dy / ITEM_HEIGHT);
      if (steps !== 0) {
        const to = Math.max(0, Math.min(totalItems - 1, ei + steps));
        if (to !== ei) onReorder(ei, to);
      }
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: true }).start();
    },
  })).current;

  return (
    <Animated.View style={{ transform: [{ translateY: pan.y }] }}>
      <View style={styles.row}>
        <View style={styles.handle} {...panResponder.panHandlers}>
          <Text style={styles.handleText}>⠿</Text>
        </View>
        <View style={{ flex: 1 }}>
          <ExerciseCard
            exercise={exercise}
            editable={editable}
            vibrationOnCheck={vibrationOnCheck}
            autoStartTimer={autoStartTimer}
            previousWeight={weightHistory[exercise.name.toLowerCase().trim()]}
            onToggleSeries={onToggleSeries}
            onEdit={(field, value) => onEdit(field as string, value)}
            onSaveAll={onSaveAll}
            onTimerStart={onTimerStart}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
          />
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main component ────────────────────────────────────────────────
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
          <DraggableItem
            key={exercise.id}
            exercise={exercise}
            ei={ei}
            totalItems={section.exercises.length}
            editable={editable}
            vibrationOnCheck={vibrationOnCheck}
            autoStartTimer={autoStartTimer}
            weightHistory={weightHistory}
            onToggleSeries={(si) => onToggleSeries(ei, si)}
            onEdit={(field, value) => onEdit(ei, field, value)}
            onSaveAll={(updated) => onSaveAll(ei, updated)}
            onTimerStart={onTimerStart}
            onDuplicate={() => onDuplicate(ei)}
            onDelete={() => onDelete(ei)}
            onReorder={onReorder}
          />
        ))}
      </>
    );
  }

  // ─── Web drag & drop ─────────────────────────────────────────────
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
    if (dragIdx !== null && dragIdx !== idx) onReorder(dragIdx, idx);
    setDragIdx(null); setOverIdx(null);
  };
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null); };

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
  row: { flexDirection: 'row', alignItems: 'center' },
  handle: { paddingHorizontal: 6, paddingVertical: 14, justifyContent: 'center', alignItems: 'center' },
  handleText: { color: theme.textMuted, fontSize: 18 },
});
