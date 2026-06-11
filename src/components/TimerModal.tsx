import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { theme } from '../constants/theme';

function playBeep(type: 'phase' | 'finish') {
  if (Platform.OS !== 'web') return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beeps = type === 'finish'
      ? [
          { freq: 880, start: 0, duration: 0.15 },
          { freq: 880, start: 0.2, duration: 0.15 },
          { freq: 1320, start: 0.4, duration: 0.4 },
        ]
      : [
          { freq: 660, start: 0, duration: 0.2 },
          { freq: 880, start: 0.25, duration: 0.2 },
        ];
    beeps.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime + start);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    });
  } catch {}
}

type Phase = 'work' | 'rest' | 'done';

interface TimerModalProps {
  visible: boolean;
  seconds: number;
  workSeconds?: number;
  quickButtons: number[];
  soundOnFinish: boolean;
  vibrationOnFinish: boolean;
  onClose: () => void;
}

export default function TimerModal({
  visible,
  seconds,
  workSeconds,
  quickButtons,
  soundOnFinish,
  vibrationOnFinish,
  onClose,
}: TimerModalProps) {
  const [phase, setPhase] = useState<Phase>(workSeconds ? 'work' : 'rest');
  const [remaining, setRemaining] = useState(workSeconds || seconds);
  const [total, setTotal] = useState(workSeconds || seconds);
  const [done, setDone] = useState(false);

  const phaseRef = useRef<Phase>(workSeconds ? 'work' : 'rest');
  const remainingRef = useRef(workSeconds || seconds);
  const totalSecondsRef = useRef(workSeconds || seconds);
  const restSecondsRef = useRef(seconds);
  const soundRef = useRef(soundOnFinish);
  const vibrationRef = useRef(vibrationOnFinish);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  soundRef.current = soundOnFinish;
  vibrationRef.current = vibrationOnFinish;
  restSecondsRef.current = seconds;

  const startPulse = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [pulseAnim]);

  const stopInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startInterval = useCallback(() => {
    stopInterval();
    intervalRef.current = setInterval(() => {
      remainingRef.current -= 1;
      setRemaining(remainingRef.current);

      if (remainingRef.current <= 0) {
        stopInterval();

        if (phaseRef.current === 'work') {
          // Transition to rest
          if (soundRef.current) playBeep('phase');
          if (vibrationRef.current) Vibration.vibrate([0, 150, 100, 150]);
          startPulse();

          phaseRef.current = 'rest';
          remainingRef.current = restSecondsRef.current;
          totalSecondsRef.current = restSecondsRef.current;
          setPhase('rest');
          setRemaining(restSecondsRef.current);
          setTotal(restSecondsRef.current);
          startInterval();
        } else {
          // All done
          if (soundRef.current) playBeep('finish');
          if (vibrationRef.current) Vibration.vibrate([0, 200, 100, 200, 100, 400]);
          startPulse();
          phaseRef.current = 'done';
          setPhase('done');
          setDone(true);
          setTimeout(() => onClose(), 1500);
        }
      }
    }, 1000);
  }, [startPulse]);

  useEffect(() => {
    if (visible) {
      const startPhase: Phase = workSeconds ? 'work' : 'rest';
      const startRemaining = workSeconds || seconds;

      phaseRef.current = startPhase;
      remainingRef.current = startRemaining;
      totalSecondsRef.current = startRemaining;
      setPhase(startPhase);
      setRemaining(startRemaining);
      setTotal(startRemaining);
      setDone(false);
      startInterval();
    } else {
      stopInterval();
    }
    return stopInterval;
  }, [visible]);

  const addTime = (secs: number) => {
    if (done) return;
    remainingRef.current += secs;
    setRemaining(remainingRef.current);
    if (phaseRef.current === 'done') {
      phaseRef.current = 'rest';
      setPhase('rest');
      setDone(false);
      startInterval();
    }
  };

  const formatTime = (secs: number) => {
    const s = Math.max(0, secs);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    if (m > 0) return `${m}:${sec.toString().padStart(2, '0')}`;
    return `${sec}`;
  };

  const isWork = phase === 'work';
  const timerColor = isWork ? theme.workColor : theme.timerColor;

  // Anillo de barritas que se van completando con el tiempo transcurrido
  const circleSize = 260;
  const center = circleSize / 2;
  const tickCount = 48;
  const tickLength = 16;
  const outerRadius = center - 4;
  const innerRadius = outerRadius - tickLength;
  const elapsedFraction = done ? 1 : Math.min(1, Math.max(0, 1 - remaining / total));
  const filledTicks = Math.round(elapsedFraction * tickCount);

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const angle = (i / tickCount) * 2 * Math.PI - Math.PI / 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return (
      <Line
        key={i}
        x1={center + cos * innerRadius}
        y1={center + sin * innerRadius}
        x2={center + cos * outerRadius}
        y2={center + sin * outerRadius}
        stroke={i < filledTicks ? timerColor : 'rgba(255, 255, 255, 0.12)'}
        strokeWidth={5}
        strokeLinecap="round"
      />
    );
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, isWork && styles.cardWork]}>
          <View style={styles.timerContainer}>
            <Svg width={circleSize} height={circleSize} style={styles.circleContainer}>
              {ticks}
            </Svg>

            <Text style={[styles.label, isWork && styles.labelWork]}>
              {isWork ? 'TRABAJO' : done ? '¡LISTO!' : 'DESCANSO'}
            </Text>

            <Animated.Text
              style={[
                styles.timer,
                { transform: [{ scale: pulseAnim }] },
                isWork && styles.timerWork,
                done && styles.timerDone,
              ]}
            >
              {done ? '0' : formatTime(remaining)}
            </Animated.Text>

            <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
              <Text style={styles.skipText}>SALTAR</Text>
            </TouchableOpacity>
          </View>
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  cardWork: {
    borderColor: theme.workColor,
  },
  label: {
    color: theme.textMuted,
    fontSize: 12,
    letterSpacing: 3,
    marginBottom: 2,
    fontWeight: '700',
  },
  labelWork: {
    color: theme.workColor,
  },
  timerContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  timer: {
    fontSize: 64,
    fontWeight: '700',
    color: theme.timerColor,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  timerWork: {
    color: theme.workColor,
  },
  timerDone: {
    color: theme.textColor,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickBtn: {
    borderWidth: 1,
    borderColor: theme.borderColor,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  quickBtnText: {
    color: theme.textMuted,
    fontSize: 13,
  },
  skipBtn: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: theme.borderColor,
  },
  skipText: {
    color: theme.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
