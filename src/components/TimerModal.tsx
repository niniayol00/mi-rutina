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
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);

  const phaseRef = useRef<Phase>(workSeconds ? 'work' : 'rest');
  const remainingRef = useRef(workSeconds || seconds);
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
          setPhase('rest');
          setRemaining(restSecondsRef.current);
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
      setPhase(startPhase);
      setRemaining(startRemaining);
      setDone(false);
      setPaused(false);
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

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, isWork && styles.cardWork]}>

          <Text style={[styles.label, isWork && styles.labelWork]}>
            {isWork ? 'TRABAJO' : done ? '¡LISTO!' : 'DESCANSO'}
          </Text>

          {workSeconds ? (
            <View style={styles.phaseIndicator}>
              <View style={[styles.phaseDot, phase !== 'work' && styles.phaseDotDone]} />
              <View style={styles.phaseLine} />
              <View style={[styles.phaseDot, done && styles.phaseDotDone]} />
            </View>
          ) : null}

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


          {!done && (
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={() => {
                if (paused) { setPaused(false); startInterval(); }
                else { setPaused(true); stopInterval(); }
              }}
            >
              <Text style={styles.pauseBtnText}>{paused ? '▶ CONTINUAR' : '⏸ PAUSA'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.skipBtn} onPress={onClose}>
            <Text style={styles.skipText}>SALTAR</Text>
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
    padding: 40,
    alignItems: 'center',
    width: '80%',
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
    marginBottom: 16,
    fontWeight: '700',
  },
  labelWork: {
    color: theme.workColor,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.borderColor,
  },
  phaseDotDone: {
    backgroundColor: theme.timerColor,
  },
  phaseLine: {
    width: 30,
    height: 2,
    backgroundColor: theme.borderColor,
  },
  timer: {
    fontSize: theme.fontSize.timer,
    fontWeight: '700',
    color: theme.timerColor,
    fontVariant: ['tabular-nums'],
    minWidth: 140,
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
  pauseBtn: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: theme.timerColor,
  },
  pauseBtnText: {
    color: theme.timerColor,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  skipBtn: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 40,
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
