import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

interface MotivationOverlayProps {
  visible: boolean;
  routineName: string;
}

const MESSAGES = [
  '¡Excelente trabajo! 💪',
  '¡Rutina completada! 🔥',
  '¡Lo lograste! ⚡',
  '¡Sos imparable! 🚀',
];

export default function MotivationOverlay({ visible, routineName }: MotivationOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const [message, setMessage] = useState(MESSAGES[0]);

  useEffect(() => {
    if (visible) setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  }, [visible]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.routineName}>{routineName}</Text>
        <Text style={styles.sub}>Guardando en tu historial...</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.timerColor,
    width: '80%',
    gap: 8,
  },
  message: {
    color: theme.timerColor,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  routineName: {
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  sub: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
