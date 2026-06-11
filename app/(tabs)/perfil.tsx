import { SafeAreaView, StyleSheet } from 'react-native';
import PerfilScreen from '../../src/screens/PerfilScreen';
import { theme } from '../../src/constants/theme';

export default function Perfil() {
  return (
    <SafeAreaView style={styles.safe}>
      <PerfilScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: theme.backgroundColor },
});
