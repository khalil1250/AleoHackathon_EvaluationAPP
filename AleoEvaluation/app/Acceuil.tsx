import { Ionicons } from '@expo/vector-icons'; // import de l'icône
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
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

      {/* Bouton de déconnexion en haut à droite */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
        <Ionicons name="log-out-outline" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Contenu principal */}
      <View style={styles.content}>
        <Text style={styles.title}>Bienvenue sur Aleo !</Text>
        <Text style={styles.subtitle}>Vous êtes connecté 🎉</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#dddddd',
    marginBottom: 30,
  },
});
