import bcrypt from 'bcryptjs';
import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import './css/index.css';
import { supabase } from '../lib/supabase';
import { session } from '../lib/session';
import ConnexionIcon from '../assets/images/ConnexionIcon.png';
import GradientBackground from './css/GradientBackground';

export default function Index() {
  const navigate = useNavigate();
  const fadeRef = useRef<HTMLDivElement>(null);
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

  const handleLogin = async () => {
    if (!username || !password) {
      alert('Erreur : Veuillez remplir tous les champs.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .single();

      if (error || !data) {
        alert('Utilisateur introuvable');
        return;
      }

      const isMatch = await bcrypt.compare(password, data.password_hash);

      if (!isMatch) {
        alert('Mot de passe incorrect');
        return;
      }
      session.username = username.trim();
      session.passwordHash = data.password_hash;
      navigate('/Acceuil');
    } catch (e) {
      console.error(e);
      alert('Erreur : Impossible de vérifier les identifiants.');
    }
  };

  return (
      <div className="index-page">
        <GradientBackground />
    <div className="container">
      

      <div className="content">
        <img src={ConnexionIcon} alt="Logo" className="logo" />
        <h1 className="title">Bienvenue !</h1>
        <p className="subtitle">Votre aventure commence ici.</p>

        <input
          className="input"
          placeholder="👤 ID (mail, username, key)"
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

        <button className="button" onClick={handleLogin}>
          Se connecter
        </button>

        <p className="link" onClick={() => navigate('/Inscription')}>
          Créer un compte
        </p>
      </div>
    </div>
  </div>
  );
}