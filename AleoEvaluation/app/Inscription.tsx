// app/Inscription.tsx
import bcrypt from 'bcryptjs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Inscription() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 4000, useNativeDriver: false })
      ])
    ).start();
  }, []);

  const handleSignUp = async () => {
    if (!username || !password) {
      alert('Veuillez remplir tous les champs.');
      return;
    }

    try {
      const password_hash = await bcrypt.hash(password, 10);
      const { error } = await supabase.from('users').insert([
        { username: username.trim(), password_hash }
      ]);

      if (error) {
        alert('Erreur lors de la création du compte.');
        return;
      }

      alert("Votre compte a été créé. Aller dans l'onglet compte pour compléter votre profile.");
      router.push('/'); // retourne à la page de connexion
    } catch (e) {
      console.error(e);
      alert('Erreur : Impossible de créer un compte.');
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient
        colors={['#1F3B73', '#2C5364', '#0F2027']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={['#0F2027', '#1F3B73', '#2C5364']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.content}>
        <Image
          source={require('../assets/images/ConnexionIcon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Créer un compte</Text>

        <TextInput
          style={styles.input}
          placeholder="👤 Nom d'utilisateur"
          placeholderTextColor="#ccc"
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="🔒 mot de passe"
          placeholderTextColor="#ccc"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>S'inscrire</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
    resizeMode: 'contain',
    borderRadius: 10,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20
  },
  input: {
    width: '100%',
    maxWidth: 400,
    padding: 12,
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#fff'
  },
  button: {
    backgroundColor: '#e29834',
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
});
