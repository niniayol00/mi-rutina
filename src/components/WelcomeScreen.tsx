import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { theme } from '../constants/theme';

interface WelcomeScreenProps {
  routineName: string;
  onStart: () => void;
}

export default function WelcomeScreen({ routineName, onStart }: WelcomeScreenProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18 }),
    ]).start();
  }, []);

  const handleStart = () => {
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }).start(onStart);
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.greeting}>Bienvenida a</Text>
        <Text style={styles.appName}>Tu rutina</Text>
        <Text style={styles.routineName}>{routineName}</Text>

        <TouchableOpacity style={styles.btn} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.btnText}>Empecemos 💪</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  greeting: {
    color: theme.textMuted,
    fontSize: 18,
    fontWeight: '400',
    letterSpacing: 1,
  },
  appName: {
    color: theme.timerColor,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1,
  },
  routineName: {
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 24,
    opacity: 0.7,
  },
  btn: {
    backgroundColor: theme.timerColor,
    borderRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 52,
    marginTop: 16,
  },
  btnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
