import { SafeAreaView, StyleSheet } from 'react-native';
import HomeScreen from '../src/screens/HomeScreen';
import { theme } from '../src/constants/theme';

export default function Rutina() {
  return (
    <SafeAreaView style={styles.safe}>
      <HomeScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundColor },
});
