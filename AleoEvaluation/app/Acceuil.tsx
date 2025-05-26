import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function Acceuil() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, []);

  const handleLogout = () => {
    router.push('/');
  };

  const buttons = [
    { title: 'Send Info', onPress: () => {} },
    { title: 'See Info', onPress: () => {} },
    { title: 'Evaluations', onPress: () => {} },
    { title: 'Account', onPress: () => {} },
  ];

  return (
    <View style={{ flex: 1 }}>
      {/* Dégradé principal */}
      <LinearGradient
        colors={['#1F3B73', '#2C5364', '#0F2027']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Dégradé animé */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#0F2027', '#1F3B73', '#2C5364']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Bouton logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Contenu principal avec les boutons */}
      <View style={styles.content}>
        {buttons.map((btn, idx) => (
          <Pressable
            key={idx}
            onPress={btn.onPress}
            style={({ pressed }) => [
              styles.mainButton,
              pressed && styles.mainButtonPressed,
            ]}
          >
            <Text style={styles.mainButtonText}>{btn.title}</Text>
          </Pressable>
        ))}
      </View>

      {/* Bouton "Parameters" en bas à droite */}
      <View style={styles.bottomRight}>
        <Pressable
          onPress={() => {}}
          style={({ pressed }) => [
            styles.mainButton,
            pressed && styles.mainButtonPressed,
          ]}
        >
          <Text style={styles.mainButtonText}>Parameters</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 20,
  },
  logoutButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#e29834',
    padding: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
  },
  mainButton: {
    width: 200,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffffff66',
  },
  mainButtonPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  mainButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bottomRight: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
});
