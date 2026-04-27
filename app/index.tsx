import { SafeAreaView, StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { Link } from 'expo-router';
import HomeScreen from '../src/screens/HomeScreen';
import { theme } from '../src/constants/theme';

export default function Index() {
  return (
    <SafeAreaView style={styles.safe}>
      <HomeScreen />
      <View style={styles.fab}>
        <Link href="/input" asChild>
          <TouchableOpacity style={styles.fabBtn}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.backgroundColor,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fabBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.timerColor,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.timerColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    color: '#000',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 32,
  },
});
