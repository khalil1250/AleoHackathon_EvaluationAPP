import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function Index() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: false
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 4000,
          useNativeDriver: false
        })
      ])
    ).start();
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      window.alert('Erreur : Veuillez remplir tous les champs.');
      return;
    }
     try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .eq('password', password) // en vrai, il faudrait utiliser du hash
      .single(); // attend un seul résultat
    /*
    console.log("Requête envoyée avec :", username, password);
    console.log("Résultat data:", data);
    console.log("Erreur:", error);
    */
    if (error || !data) {
      window.alert('Erreur : Identifiants incorrects');
      return;
    }

    // Connexion réussie
    router.push('/Acceuil');
  } catch (e) {
    console.error(e);
    window.alert('Erreur : Impossible de vérifier les identifiants.');
  }
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Dégradé 1 */}
      <LinearGradient
        colors={['#1F3B73', '#2C5364', '#0F2027']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Dégradé 2 superposé, animé */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: fadeAnim }
        ]}
      >
        <LinearGradient
          colors={['#0F2027', '#1F3B73', '#2C5364']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Contenu */}
      <View style={styles.content}>
        <Image
          source={require('../assets/images/ConnexionIcon.png')}
          style={styles.logo}
        />
        <Text style={styles.title}>Bienvenue !</Text>
        <Text style={styles.subtitle}>Votre aventure commence ici.</Text>

        <TextInput
          style={styles.input}
          placeholder="👤 ID (mail, username, key)"
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

        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Se connecter</Text>
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
    marginBottom: 5
  },
  subtitle: {
    fontSize: 16,
    color: '#dddddd',
    marginBottom: 30
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
