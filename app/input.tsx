import { SafeAreaView, StyleSheet } from 'react-native';
import InputScreen from '../src/screens/InputScreen';
import { theme } from '../src/constants/theme';

export default function InputRoute() {
  return (
    <SafeAreaView style={styles.safe}>
      <InputScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
});
