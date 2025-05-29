import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLogOutOutline, IoArrowBackOutline } from 'react-icons/io5';
import './css/SendInfo.css';
import GradientBackground from './css/GradientBackground';
import { session } from '../lib/session';
import { supabase } from '../lib/supabase';
import { encryptWithViewKey, deriveKey, decrypt } from '../encrypt_decrypt';

export default function SendInfo() {
  const navigate = useNavigate();
  const fadeRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [hasEmetteurRole, setHasEmetteurRole] = useState(false);
  const [verifieur, setVerifieur] = useState('');


  // 👉 Async logic pour charger les infos utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: companyid, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', session.username)
          .single();
        ;
        if (error || !companyid.company_id) {
          alert("Utilisateur introuvable ou vous n'êtes pas associé à une entreprise");
          navigate('/');
          return;
        }
        const { data: keys, error: error1 } = await supabase
          .from('aleo_key')
          .select('*')
          .eq('username', session.username)
          .single();

        if (error1 || !keys) {
          alert('Clés Aleo introuvables');
          navigate('/');
          return;
        }

        const { data: roles, error: error2 } = await supabase
          .from('user_for_role')
          .select('*')
          .eq('username', session.username)
          .eq('company_id', companyid.company_id)
          .single();
        //console.log({"username":session.username, "compid": companyid.company_id });
        if (error2 || !roles.role) {
          alert('Rôle introuvable');
          navigate('/');
          return;
        }

        const fullUser = {
          username: session.username,
          password_hash: session.passwordHash,
          company_id: companyid.company_id,
          keys: {
            privateKey: keys.private_key,
            viewKey: keys.view_key,
            add: keys.address,
          },
          role: roles.role,
        };

        setUser(fullUser);
        setHasEmetteurRole(fullUser.role === 'émetteur');

        if (fullUser.role !== 'émetteur') {
          alert("Vous n'êtes pas un émetteur d'information pour votre entreprise.");
          navigate('/Acceuil');
        }
      } catch (err) {
        console.error('Erreur de chargement utilisateur', err);
        alert('Erreur serveur');
        navigate('/');
      }
    };

    loadUser();
  }, [navigate]);

  // Animation
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

  const handleLogout = () => navigate('/');
  const handleBack = () => navigate('/Acceuil');

  const handleFile = async (file: File) => {
    if (!user) return;
    /*
    console.log("Fichier reçu:", file);
    console.log("userk", user.keys.viewKey);
    console.log("Using password hash:", user.password_hash);
    const {data} = await supabase.from("users").select("password_hash").eq("username", user.username).single();
    console.log("eq", user.passwordHash === data.password_hash);
    */
    
    const key = await deriveKey(user.username, user.password_hash);
    //console.log("key", key);
    const decrypted_viewK = await decrypt(user.keys.viewKey, key);
    //console.log("decryptedVK", decrypted_viewK);
    const content = await file.text();
    //console.log("content", content);
    const encrypted = await encryptWithViewKey(content, decrypted_viewK);
    //console.log("encrypted", encrypted);
    setFileName(file.name);

    //console.log('Encrypted content:', encrypted);

    const { error } = await supabase
      .from("information")
      .insert([
        {
          company_id: user.company_id,
          information: encrypted,
          information_name: file.name,
        },
      ]);

    if (error) {
      console.error("Erreur Supabase:", error);
      alert("Erreur lors du stockage de l'information");
      navigate("/");
      return;
    }
};


  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleBrowse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!hasEmetteurRole) {
      alert("Vous devez être émetteur dans l'entreprise.");
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      await handleFile(file);
    }
  };

  return (
    <div className="container">
      <GradientBackground />

      <button className="logout-button" onClick={handleLogout}>
        <IoLogOutOutline size={24} />
      </button>

      <button className="back-button" onClick={handleBack}>
        <IoArrowBackOutline size={24} />
      </button>
      <div className="verifieur-input-container">
  <label htmlFor="verifieur" className="verifieur-label">
    Entrer le username de votre validateur :
  </label>
  <input
    type="text"
    id="verifieur"
    value={verifieur}
    onChange={(e) => setVerifieur(e.target.value)}
    placeholder="Username du validateur"
    className="verifieur-input"
  />
</div>

      <div
        className={`drop-area ${dragActive ? 'active' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
      >
        <label htmlFor="file-upload" className="drop-label">
          {fileName
            ? `Fichier sélectionné : ${fileName}`
            : 'Cliquez ou glissez un fichier JSON ici'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept=".json"
          onChange={handleBrowse}
          hidden
        />
      </div>
    </div>
  );
}
