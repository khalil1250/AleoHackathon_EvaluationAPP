import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoLogOutOutline, IoArrowBackOutline } from 'react-icons/io5';
import './css/SendInfo.css';
import GradientBackground from './css/GradientBackground';
import { session } from '../lib/session';
import { supabase } from '../lib/supabase';
import { encrypt, deriveKey, decrypt } from '../encrypt_decrypt';

export default function SendInfo() {
  const navigate = useNavigate();
  const fadeRef = useRef<HTMLDivElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<any>(null);
  //const [hasEmetteurRole, setHasEmetteurRole] = useState(false);
  const [verifieur, setVerifieur] = useState('');


  // 👉 Async logic pour charger les infos utilisateur
  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: company, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', session.username)
          .single();
        ;
        if (error ) {
          alert("Utilisateur introuvable");
          navigate('/');
          return;
        }
        if ( !company.company_id ) {
          alert("Vous n'êtes pas associé à une entreprise");
          navigate('/');
          return;
        }
        if (!company.role_id ) {
          alert("L'utilisateur n'a pas de rôle dans son entreprise (absurde)");
          navigate('/');
          return;
        }
        //console.log(session.username, session.passwordHash);
    

        

        const { data: getRole, error: error3 } = await supabase
          .from('company_roles')
          .select('*')
          .eq('role_id', company.role_id)
          .eq('company_id', company.company_id)
          .single();
        if (error3 || !getRole.role_name) {
          alert('Rôle introuvable pour cette entreprise ou erreur base de donnée');
          navigate('/');
          return;
        }


        const fullUser = {
          username: session.username,
          password_hash: session.passwordHash,
          company_id: company.company_id,
          role: getRole.role_name,
        };

        setUser(fullUser);
        //setHasEmetteurRole(fullUser.role === 'émetteur');

        if (fullUser.role.toLowerCase() !== 'émetteur' && fullUser.role.toLowerCase() !== 'owner') {
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
    
    //console.log("Fichier reçu:", file);
    //console.log("userk", user.keys.viewKey);
    //console.log("Using password hash:", user.password_hash);
    //const {data} = await supabase.from("users").select("password_hash").eq("username", user.username).single();
    //console.log("eq", user.passwordHash === data.password_hash);
     
    
    const key = await deriveKey(user.username, user.password_hash);
    //console.log("key", key);
    //const decrypted_viewK = await decrypt(user.keys.viewKey, key);
    //console.log("decryptedVK", decrypted_viewK);
    const content = await file.text();
    //console.log("content", content);
    const encrypted = await encrypt(content, key);
    //console.log("encrypted", encrypted);
    //const decrypted = await decrypt(encrypted, key);

    setFileName(file.name);

    console.log('Encrypted content:', encrypted);
    //console.log('Decrypted content:', decrypted);

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
    /*
    const {data:elo} = await supabase.from("information").select("*").eq("information_name", file.name).single();
    const decrypted = await decrypt(elo.information, key);
    console.log(decrypted);
    */
    alert("Votre fichier a été ajouté avec succès.")
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
    /*
    if (!hasEmetteurRole) {
      alert("Vous devez être émetteur dans l'entreprise.");
      return;
    }*/
    const { data: valid, error: error } = await supabase
          .from('Validators')
          .select('*')
          .eq('username', verifieur)
          .eq('company_id', user.company_id)
          .single();
    
        if (error || !valid) {
          alert("Ce valideur n'existe pas ou votre entreprise ne lui est pas associé");
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
