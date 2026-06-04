import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
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

function MonthGrid({ year, month, trainingDates, today }: {
  year: number; month: number; trainingDates: string[]; today: Date;
}) {
  const rawFirstDay = new Date(year, month, 1).getDay();
  const firstDay = rawFirstDay === 0 ? 6 : rawFirstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isTraining = (d: number) => {
    const s = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return trainingDates.includes(s);
  };
  const isToday = (d: number) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <View style={styles.monthBlock}>
      <Text style={styles.monthTitle}>{MONTHS[month]} {year}</Text>
      <View style={styles.dayHeaders}>
        {DAYS.map((d) => <Text key={d} style={styles.dayHeader}>{d}</Text>)}
      </View>
      <View style={styles.grid}>
        {cells.map((day, i) => (
          <View key={i} style={styles.cell}>
            {day !== null && (
              <View style={[styles.dayContainer, isToday(day) && styles.dayToday]}>
                <Text style={[styles.dayText, isToday(day) && styles.dayTodayText]}>{day}</Text>
                {isTraining(day) && <View style={styles.dot} />}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function CalendarModal({ visible, trainingDates, onClose }: CalendarModalProps) {
  const [showAll, setShowAll] = useState(false);
  const today = new Date();

  const getMonthsToShow = () => {
    if (!showAll) return [{ year: today.getFullYear(), month: today.getMonth() }];
    if (trainingDates.length === 0) return [{ year: today.getFullYear(), month: today.getMonth() }];

    const sorted = [...trainingDates].sort();
    const [fy, fm] = sorted[0].split('-').map(Number);
    const months: { year: number; month: number }[] = [];
    let y = fy, m = fm - 1;
    while (y < today.getFullYear() || (y === today.getFullYear() && m <= today.getMonth())) {
      months.push({ year: y, month: m });
      m++;
      if (m > 11) { m = 0; y++; }
    }
    return months.reverse();
  };

  const monthsToShow = getMonthsToShow();

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <ScrollView showsVerticalScrollIndicator={false} style={{ width: '100%' }}>
            {monthsToShow.map(({ year, month }) => (
              <MonthGrid
                key={`${year}-${month}`}
                year={year}
                month={month}
                trainingDates={trainingDates}
                today={today}
              />
            ))}
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.verTodoBtn}
                onPress={() => setShowAll(v => !v)}
              >
                <Text style={styles.verTodoBtnText}>
                  {showAll ? 'Ver mes actual' : 'Ver todo el historial'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setShowAll(false); onClose(); }}>
                <Text style={styles.closeBtnText}>CERRAR</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    width: '92%',
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: theme.timerColor,
    alignItems: 'center',
  },
  monthBlock: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  monthTitle: {
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  dayHeaders: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 4,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    color: theme.textMuted,
    fontSize: 10,
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
  },
  dayContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  dayToday: { backgroundColor: theme.borderColor },
  dayText: { color: theme.textColor, fontSize: 12 },
  dayTodayText: { fontWeight: '700' },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.timerColor,
    marginTop: 1,
  },
  btnRow: {
    gap: 12,
    alignItems: 'center',
    paddingBottom: 8,
  },
  verTodoBtn: {
    borderWidth: 1,
    borderColor: theme.timerColor,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 28,
  },
  verTodoBtnText: {
    color: theme.timerColor,
    fontWeight: '700',
    fontSize: 13,
  },
  closeBtn: {
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
