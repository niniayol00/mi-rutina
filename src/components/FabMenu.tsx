import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { theme } from '../constants/theme';

interface FabMenuProps {
  visible: boolean;
  onClose: () => void;
  onAddExercise: () => void;
  onNewRoutine: () => void;
  onDuplicateRoutine: () => void;
}

export default function FabMenu({ visible, onClose, onAddExercise, onNewRoutine, onDuplicateRoutine }: FabMenuProps) {
  const handleOption = (fn: () => void) => { onClose(); fn(); };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.menu}>
          <Text style={styles.menuTitle}>¿Qué querés hacer?</Text>

          <TouchableOpacity style={styles.option} onPress={() => handleOption(onAddExercise)}>
            <Text style={styles.optionIcon}>➕</Text>
            <View>
              <Text style={styles.optionLabel}>Agregar ejercicio</Text>
              <Text style={styles.optionSub}>A la rutina actual</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.option} onPress={() => handleOption(onNewRoutine)}>
            <Text style={styles.optionIcon}>📋</Text>
            <View>
              <Text style={styles.optionLabel}>Nueva rutina</Text>
              <Text style={styles.optionSub}>Crear desde texto o en blanco</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={() => handleOption(onDuplicateRoutine)}>
            <Text style={styles.optionIcon}>⧉</Text>
            <View>
              <Text style={styles.optionLabel}>Duplicar rutina actual</Text>
              <Text style={styles.optionSub}>Para hacer variaciones</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  menu: {
    backgroundColor: theme.cardBackground,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
    borderWidth: 1, borderColor: theme.borderColor,
  },
  menuTitle: {
    color: theme.textMuted, fontSize: 12,
    letterSpacing: 2, fontWeight: '700',
    marginBottom: 20, textAlign: 'center',
  },
  option: {
    flexDirection: 'row', alignItems: 'center',
    gap: 16, paddingVertical: 14,
  },
  optionIcon: { fontSize: 22, width: 32, textAlign: 'center' },
  optionLabel: { color: theme.textColor, fontSize: 16, fontWeight: '600' },
  optionSub: { color: theme.textMuted, fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: theme.borderColor, marginVertical: 4 },
  cancelBtn: {
    marginTop: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: theme.borderColor,
    borderRadius: 12, alignItems: 'center',
  },
  cancelText: { color: theme.textMuted, fontSize: 14, fontWeight: '600' },
});
