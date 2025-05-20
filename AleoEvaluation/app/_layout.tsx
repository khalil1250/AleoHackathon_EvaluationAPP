import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function Layout() {
  return (
    <Stack>
      <StatusBar style="light" />
      <Stack.Screen 
      name="index"
      options={{headerTitle:"Aleo App"
      }}
      />
      <Stack.Screen 
      name="Acceuil"
      />
    </Stack>
  );
}
