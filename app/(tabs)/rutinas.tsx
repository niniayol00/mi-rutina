import { SafeAreaView, StyleSheet } from 'react-native';
import RoutinesScreen from '../../src/screens/RoutinesScreen';
import { theme } from '../../src/constants/theme';

export default function Rutinas() {
  return (
    <SafeAreaView style={styles.safe}>
      <RoutinesScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundColor },
});
