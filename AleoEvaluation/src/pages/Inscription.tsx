import bcrypt from 'bcryptjs';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Account } from '@provablehq/sdk';
import './css/Inscription.css';
import { IoArrowBackOutline } from 'react-icons/io5';
import GradientBackground from './css/GradientBackground';
import {deriveKey, encrypt, decrypt} from "../encrypt_decrypt.ts";
import { supabase } from '../lib/supabase';
import ConnexionIcon from '../assets/images/ConnexionIcon.png';

export default function Inscription() {
  const fadeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [key, setPublicKey] = useState('');

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
      const password_hash : string = await bcrypt.hash(password, 10);
      /*
      const account = new Account();
      const privateKey = account.privateKey().to_string();
      const viewKey = account.viewKey().to_string();
      const address = account.address().to_string();     

      const key = await deriveKey(username, password_hash);
      
      const encryptedPrivateKey = await encrypt(privateKey, key);
      const encryptedViewKey = await encrypt(viewKey, key);
      const encryptedAddress = await encrypt(address, key);

      console.log('Encrypted keys:', { encryptedPrivateKey, encryptedViewKey, encryptedAddress });

      const decryptedPrivateKey = await decrypt(encryptedPrivateKey, key);
      const decryptedViewKey = await decrypt(encryptedViewKey, key);
      const decryptedAddress = await decrypt(encryptedAddress, key);

      console.log('Decrypted keys:', { decryptedPrivateKey, decryptedViewKey, decryptedAddress });
      
      */
    
      const { error:error1 } = await supabase.from('users').insert([
        { username: username.trim(), password_hash , public_key:key}
      ]);


      if (error1) {
        alert('Erreur lors de la création du compte user.');
        return;
      }
      /*
      const {error:error2} = await supabase.from('aleo_key').insert([
        { username: username.trim(), private_key : encryptedPrivateKey, view_key:encryptedViewKey, address:encryptedAddress }
      ]);
      if (error2) {
        alert('Erreur lors de la création du compte aleo.');
        return;
      }
*/
      

      alert("Votre compte a été créé. Aller dans l'onglet compte pour compléter votre profil.");
      navigate('/');
    } catch (e) {
      console.error(e);
      alert('Erreur : Impossible de créer un compte.');
    }
  };

  const handleBack = () => navigate('/');

  return (
    <div className="inscription-container">
      <GradientBackground/>
       <button className="back-button" onClick={handleBack}>
              <IoArrowBackOutline size={24} />
            </button>
      <div className="inscription-content">
        <img src={ConnexionIcon} alt="Logo" className="inscription-logo" />
        <h1 className="inscription-title">Créer un compte</h1>

        <input
          className="inscription-input"
          placeholder="👤 Nom d'utilisateur"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="inscription-input"
          type="password"
          placeholder="🔒 mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          className="inscription-input"
          type="password"
          placeholder="🔒 Votre clé de wallet aleo"
          value={key}
          onChange={(e) => setPublicKey(e.target.value)}
        />

        <button className="inscription-button" onClick={handleSignUp}>
          S'inscrire
        </button>
      </div>
    </div>
  );
}