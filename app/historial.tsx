import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import HistorialScreen from '../src/screens/HistorialScreen';
import { theme } from '../src/constants/theme';

export default function Historial() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Historial</Text>
        <View style={{ width: 70 }} />
      </View>
      <HistorialScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundColor },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: { paddingVertical: 4 },
  backText: { color: theme.timerColor, fontSize: 14, fontWeight: '600' },
  title: { color: theme.textColor, fontSize: 18, fontWeight: '700' },
});
