import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

interface CompletionModalProps {
  visible: boolean;
  userName: string;
  routineName: string;
  exercisesDone: number;
  exercisesTotal: number;
  records?: string[];
  onGoToRoutines: () => void;
}

export default function CompletionModal({
  visible, userName, routineName, exercisesDone, exercisesTotal, records, onGoToRoutines,
}: CompletionModalProps) {
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

  const now = new Date();
  const dateLabel = `${DAYS[now.getDay()]} ${now.getDate()} de ${MONTHS[now.getMonth()]}`;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}>
          <Text style={styles.title}>
            {userName.trim() ? `¡Excelente trabajo, ${userName.trim()}! 🎉` : '¡Excelente trabajo! 🎉'}
          </Text>
          <Text style={styles.subtitle}>RUTINA COMPLETADA</Text>

          <View style={styles.infoBox}>
            <Text style={styles.routineName}>{routineName}</Text>
            <Text style={styles.infoText}>{dateLabel}</Text>
            <Text style={styles.infoText}>
              {exercisesDone}/{exercisesTotal} ejercicios completados
            </Text>
          </View>

          {records && records.length > 0 && (
            <View style={styles.recordsBox}>
              {records.map((name) => (
                <Text key={name} style={styles.recordText}>
                  🏆 Nuevo récord personal: {name}
                </Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={styles.btn} onPress={onGoToRoutines}>
            <Text style={styles.btnText}>VOLVER A MIS RUTINAS</Text>
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
    padding: 32,
    alignItems: 'center',
    width: '85%',
    borderWidth: 2,
    borderColor: theme.timerColor,
    gap: 14,
  },
  title: {
    color: theme.timerColor,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  infoBox: {
    alignItems: 'center',
    gap: 4,
  },
  routineName: {
    color: theme.textColor,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  infoText: {
    color: theme.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  recordsBox: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    alignSelf: 'stretch',
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
    paddingHorizontal: 32,
    marginTop: 4,
  },
  btnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: 1.5,
  },
});
