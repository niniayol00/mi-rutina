import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

interface CompletionModalProps {
  visible: boolean;
  userName: string;
  duration: string;
  records?: string[];
  onViewCalendar: () => void;
}

export default function CompletionModal({ visible, userName, duration, records, onViewCalendar }: CompletionModalProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 12 }),
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.8);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>¡SOS IMPARABLE, {userName.toUpperCase()}! 🚀</Text>
          <Text style={styles.subtitle}>RUTINA COMPLETADA</Text>
          {duration && (
            <Text style={styles.duration}>
              Hoy terminaste la rutina en: {duration}
            </Text>
          )}
          {records && records.length > 0 && (
            <View style={styles.recordsBox}>
              {records.map((name) => (
                <Text key={name} style={styles.recordText}>
                  🏆 Nuevo récord personal: {name}
                </Text>
              ))}
            </View>
          )}
          <TouchableOpacity style={styles.btn} onPress={onViewCalendar}>
            <Text style={styles.btnText}>VER CALENDARIO</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 24,
    padding: 40,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: theme.timerColor,
    gap: 16,
  },
  title: {
    color: theme.timerColor,
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.timerColor,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  duration: {
    color: theme.textMuted,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  recordsBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
  },
  recordText: {
    color: theme.warning,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  btn: {
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 8,
  },
  btnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
