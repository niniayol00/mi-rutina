import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { theme } from '../constants/theme';

interface OnboardingScreenProps {
  onComplete: (name: string) => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [name, setName] = useState('');
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 18 }),
    ]).start();
  }, []);

  const canContinue = name.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true })
      .start(() => onComplete(name.trim()));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.content, { opacity, transform: [{ translateY }] }]}>
        <Text style={styles.appName}>Mi Rutina</Text>
        <Text style={styles.subtitle}>Tu libreta digital de entrenamiento</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>¿Cómo te llamás?</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: María"
            placeholderTextColor={theme.textMuted}
            maxLength={30}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        <TouchableOpacity
          style={[styles.btn, !canContinue && styles.btnDisabled]}
          onPress={handleContinue}
          disabled={!canContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Continuar</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>No necesitás cuenta ni email. Tus datos quedan en este dispositivo.</Text>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.backgroundColor,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 32,
  },
  appName: {
    color: theme.timerColor,
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
  },
  subtitle: {
    color: theme.textMuted,
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 36,
  },
  fieldGroup: { marginBottom: 24 },
  label: {
    color: theme.textColor,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: theme.cardBackground,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: theme.textColor,
    fontSize: 18,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: theme.timerColor,
  },
  btn: {
    backgroundColor: theme.timerColor,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.3 },
  btnText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hint: {
    color: theme.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
