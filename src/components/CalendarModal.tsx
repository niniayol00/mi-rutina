import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface CalendarModalProps {
  visible: boolean;
  trainingDates: string[];
  onClose: () => void;
}

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CalendarModal({ visible, trainingDates, onClose }: CalendarModalProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  // Week starts on Monday: convert Sunday(0) to 7, then subtract 1
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isTrainingDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return trainingDates.includes(dateStr);
  };

  const isToday = (day: number) => day === today.getDate();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.congrats}>RUTINA COMPLETADA</Text>
          <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>

          <View style={styles.dayHeaders}>
            {DAYS.map((d) => (
              <Text key={d} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((day, i) => (
              <View key={i} style={styles.cell}>
                {day !== null && (
                  <View style={[styles.dayContainer, isToday(day) && styles.dayToday]}>
                    <Text style={[styles.dayText, isToday(day) && styles.dayTodayText]}>
                      {day}
                    </Text>
                    {isTrainingDay(day) && <View style={styles.dot} />}
                  </View>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Text style={styles.closeBtnText}>CERRAR</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: theme.cardBackground,
    borderRadius: 24,
    padding: 28,
    width: '90%',
    borderWidth: 1,
    borderColor: theme.timerColor,
    alignItems: 'center',
  },
  congrats: {
    color: theme.timerColor,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 20,
  },
  monthTitle: {
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  dayHeaders: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 6,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  dayToday: {
    backgroundColor: theme.borderColor,
  },
  dayText: {
    color: theme.textColor,
    fontSize: 13,
  },
  dayTodayText: {
    fontWeight: '700',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.timerColor,
    marginTop: 2,
  },
  closeBtn: {
    marginTop: 24,
    backgroundColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 40,
  },
  closeBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 2,
  },
});
