import bcrypt from 'bcryptjs';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Inscription.css';
import { supabase } from '../lib/supabase';
import ConnexionIcon from '../assets/images/ConnexionIcon.png';

export default function Inscription() {
  const fadeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    let opacity = 0;
    let direction = 1;
    const interval = setInterval(() => {
      if (fadeRef.current) {
        fadeRef.current.style.opacity = String(opacity);
      }
      opacity += direction * 0.01;
      if (opacity >= 1 || opacity <= 0) direction *= -1;
    }, 40);
    return () => clearInterval(interval);
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

      alert("Votre compte a été créé. Aller dans l'onglet compte pour compléter votre profil.");
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Erreur : Impossible de créer un compte.');
    }
  };

  return (
    <div className="container">
      <div className="gradient-layer1" />
      <div className="gradient-layer2" ref={fadeRef} />

      <div className="content">
        <img src={ConnexionIcon} alt="Logo" className="logo" />
        <h1 className="title">Créer un compte</h1>

        <input
          className="input"
          placeholder="👤 Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="🔒 mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="button" onClick={handleSignUp}>
          S'inscrire
        </button>
      </div>
    </div>
  );
}
