import { LinearGradient } from 'expo-linear-gradient';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, Text } from 'react-native';

function CustomHeader() {
  return (
    <LinearGradient
      colors={['#1F3B73', '#335F99']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <Image
        source={ require("../assets/images/mailIcon.png") }
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Aleo App</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8, // Android shadow
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        header: () => <CustomHeader />,
        headerShown:false,
      }}
    >
      <StatusBar style="light" />
      <Stack.Screen name="index" />
      <Stack.Screen name="Acceuil" />
    </Stack>
  );
}
