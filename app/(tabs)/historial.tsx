import { SafeAreaView, StyleSheet, View, Text } from 'react-native';
import HistorialScreen from '../../src/screens/HistorialScreen';
import { theme } from '../../src/constants/theme';

export default function Historial() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
      </View>
      <HistorialScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundColor },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  title: { color: theme.textColor, fontSize: 24, fontWeight: '700' },
});
