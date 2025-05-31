// src/pages/Account.tsx
import React, { useState, useEffect, useRef } from 'react';
import './css/Account.css';
import GradientBackground from './css/GradientBackground';
import { IoLogOutOutline, IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import {
  Transaction,
  WalletNotConnectedError
} from "@demox-labs/aleo-wallet-adapter-base";

import { supabase } from '../lib/supabase';
import CryptoJS from 'crypto-js';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Helpers Web Crypto pour l’AES-GCM et PBKDF2
// ─────────────────────────────────────────────────────────────────────────────

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

async function generateAESKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

async function encryptObjectWithAES(jsonObj: any): Promise<{ ciphertextBase64: string; rawKey: CryptoKey }> {
  const aesKey = await generateAESKey();
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(jsonObj));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    plaintext
  );
  const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);
  return {
    ciphertextBase64: arrayBufferToBase64(combined.buffer),
    rawKey: aesKey
  };
}

async function deriveKeyFromRecipient(recipient: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(recipient),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  const salt = encoder.encode("aleolock-salt-fixed");
  const iterations = 100_000;
  const kek = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: iterations,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  return kek;
}

async function wrapAESKeyWithRecipient(rawAesKey: CryptoKey, recipient: string): Promise<string> {
  const kek = await deriveKeyFromRecipient(recipient);
  const rawKeyBuffer = await window.crypto.subtle.exportKey("raw", rawAesKey);
  const iv2 = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext2Buffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv2 },
    kek,
    rawKeyBuffer
  );
  const combined2 = new Uint8Array(iv2.byteLength + ciphertext2Buffer.byteLength);
  combined2.set(iv2, 0);
  combined2.set(new Uint8Array(ciphertext2Buffer), iv2.byteLength);
  return arrayBufferToBase64(combined2.buffer);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Composant React complet
// ─────────────────────────────────────────────────────────────────────────────

export default function Account() {
  // === Réfs & Hooks ===
  const fadeRef = useRef<HTMLDivElement>(null);

  const [company_name, setCompanyName] = useState<string>('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string>(''); // adresse Aleo du validateur
  const [txStatus, setTxStatus] = useState<string>('');
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Contexte wallet Aleo
  const { publicKey, requestTransaction } = useWallet();
  const navigate = useNavigate();

  // ──────────── 2.1. Récupérer company_id de l'utilisateur ────────────
  useEffect(() => {
    async function fetchCompanyId() {
      if (!publicKey) return;
      const walletAddress = publicKey.toString();
      const { data: userRow, error } = await supabase
        .from('Users')
        .select('company_id')
        .eq('address', walletAddress)
        .single();
      if (!error && userRow) {
        setCompanyId(userRow.company_id);
      }
    }
    fetchCompanyId();
  }, [publicKey]);

  // ──────────── 2.2. Animation « fade » du background ────────────
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

  // ──────────── 2.3. Création / association d'entreprise ────────────
  const handleCompany = async () => {
    if (!publicKey) {
      alert("Connecte ton wallet Aleo avant.");
      return;
    }
    try {
      const walletAddress = publicKey.toString();
      const { data: userData, error: fetchUserError } = await supabase
        .from('Users')
        .select('id, company_id')
        .eq('address', walletAddress)
        .single();

      if (fetchUserError || !userData) {
        console.error('Erreur récupération user :', fetchUserError);
        alert("Impossible de récupérer tes infos utilisateur.");
        return;
      }

      if (!userData.company_id) {
        // a) Insérer nouvelle company
        const { error: insertCompanyError } = await supabase
          .from('company')
          .insert([{ name: company_name, owner_id: userData.id }]);

        if (insertCompanyError) {
          console.error('Erreur création company :', insertCompanyError);
          alert("Erreur lors de la création de la company.");
          return;
        }

        // b) Récupérer l'ID de la company
        const { data: companyInfo, error: fetchCompanyError } = await supabase
          .from('company')
          .select('id')
          .eq('owner_id', userData.id)
          .single();

        if (fetchCompanyError || !companyInfo) {
          console.error('Erreur fetchCompanyId :', fetchCompanyError);
          alert("Impossible de récupérer l’ID de la company.");
          return;
        }

        const newCompanyId = companyInfo.id;

        // c) Mettre à jour Users.company_id
        const { error: updateUserError } = await supabase
          .from('Users')
          .update({ company_id: newCompanyId })
          .eq('address', walletAddress);

        if (updateUserError) {
          console.error('Erreur update user :', updateUserError);
          alert("Erreur lors de l’association à la company.");
          return;
        }

        setCompanyId(newCompanyId);
        alert("Entreprise créée et associée avec succès !");
      } else {
        alert("Tu es déjà associé à une entreprise.");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur inattendue est survenue lors de la création de l’entreprise.");
    }
  };

  // ──────────── 2.4. Grant Permission Aleo ────────────
  const handleGrantPermission = async () => {
    if (!publicKey) {
      setTxStatus("Wallet non connecté");
      throw new WalletNotConnectedError();
    }
    if (!recipient) {
      setTxStatus("Adresse destinataire manquante");
      return;
    }
    if (!companyId) {
      alert("Tu dois être associé à une entreprise avant d’accorder une permission.");
      return;
    }

    try {
      // 2.4.1. Récupérer le dernier id de la table `information`
      const { data: lastInfo, error: fetchInfoError } = await supabase
        .from('information')
        .select('id')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchInfoError || !lastInfo) {
        console.error("Erreur récupération dernier info.id :", fetchInfoError);
        alert("Impossible de récupérer l’ID du dernier document dans information.");
        return;
      }

      // 2.4.2. Ajouter "field" à cette UUID
      const doc_id = lastInfo.id.toString() + "field";

      // 2.4.3. Construire et envoyer la transaction Aleo
      const fee = 50_000;
      const tx = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        'permission_granthack.aleo',
        'grant_permission',
        [doc_id, publicKey.toString(), recipient],
        fee,
        false
      );

      if (!requestTransaction) {
        setTxStatus("Impossible d'envoyer la transaction : fonction manquante");
        return;
      }

      setTxStatus("Envoi de la transaction en cours...");
      const result = await requestTransaction(tx);
      console.log('Résultat transaction :', result);
      setTxStatus("✅ Permission envoyée !");
    } catch (err) {
      console.error(err);
      setTxStatus("❌ Erreur lors de l’envoi");
    }
  };

  // ──────────── 2.5. Chiffrement JSON + Wrap AES Key ────────────
  const handleFile = async (file: File) => {
    if (!companyId) {
      alert("Tu dois être associé à une entreprise avant d’envoyer un fichier.");
      return;
    }

    // 1) Lire le JSON
    let text: string;
    try {
      text = await file.text();
    } catch (err) {
      console.error("Impossible de lire le fichier :", err);
      alert("Erreur lors de la lecture du fichier.");
      return;
    }

    // 2) Vérifier que ce n’est pas vide
    if (!text || text.trim() === "") {
      alert("Le fichier JSON est vide ou n'a pas pu être lu.");
      return;
    }

    // 3) JSON.parse (contrôle de validité)
    let jsonData: any;
    try {
      jsonData = JSON.parse(text);
    } catch (err) {
      console.error("JSON mal formé :", err);
      alert("Le fichier n'est pas un JSON valide.");
      return;
    }

    // 4) Chiffrer l'objet JSON en AES-GCM
    let ciphertextBase64: string;
    let rawAesKey: CryptoKey;
    try {
      const encryptionResult = await encryptObjectWithAES(jsonData);
      ciphertextBase64 = encryptionResult.ciphertextBase64;
      rawAesKey = encryptionResult.rawKey;
      console.log("Chiffrement AES réussi (CryptoKey) :", rawAesKey);
    } catch (err) {
      console.error("Erreur chiffrement AES du JSON :", err);
      alert("Impossible de chiffrer le JSON.");
      return;
    }

    // 4bis) Exporter `rawAesKey` en ArrayBuffer = 32 octets,
    //      puis en Base64 (= string)
    let aesKeyRawBuffer: ArrayBuffer;
    let aesKeyBase64: string;
    try {
      aesKeyRawBuffer = await window.crypto.subtle.exportKey("raw", rawAesKey);
      aesKeyBase64 = arrayBufferToBase64(aesKeyRawBuffer);
      console.log("Clé AES exportée en Base64 :", aesKeyBase64);
    } catch (err) {
      console.error("Erreur exportation de la clé AES :", err);
      alert("Impossible d’exporter la clé AES.");
      return;
    }

    // 5) Insérer dans Supabase, en stockant `aesKeyBase64` (string) au lieu de CryptoKey
    const { error } = await supabase
      .from('information')
      .insert([
        {
          name: file.name,
          cle_crypte: aesKeyBase64,   // on stocke la clé AES en Base64 (chaîne)
          company_id: companyId,
          fichier_crypt: ciphertextBase64,
          created_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error("Erreur Supabase :", error);
      alert("Erreur lors de l’insertion en base : " + error.message);
      return;
    }

    alert("Fichier JSON chiffré et stocké avec succès !");
  };

  // ──────────── 2.6. Gestion input file ────────────
  const handleBrowse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      await handleFile(file);
    }
  };

  // ──────────── 2.7. Logout & Back ────────────
  const handleLogout = () => {
    navigate('/');
  };
  const handleBack = () => {
    navigate('/Acceuil');
  };

  return (
    <div className="account-page">
      <div className="container">
        {/* Arrière-plan animé */}
        <GradientBackground/>

        {/* Boutons déconnexion / retour */}
        <button className="logout-button" onClick={handleLogout}>
          <IoLogOutOutline size={24} />
        </button>
        <button className="back-button" onClick={handleBack}>
          <IoArrowBackOutline size={24} />
        </button>

        <div className="content">
          {/* Création / association entreprise */}
          <input
            className="inputform"
            placeholder="Nom de votre entreprise"
            value={company_name}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <button className="valid" onClick={handleCompany}>
            Ajouter votre entreprise
          </button>

          {/* Saisie de l’adresse Aleo du validateur */}
          <input
            className="inputform"
            placeholder="Adresse Aleo du validateur (aleo1…)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />

          {/* Sélection de fichier JSON */}
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

          {/* Statut transaction (optionnel) */}
          {txStatus && <p className="tx-status">{txStatus}</p>}
          <button className="valid" onClick={handleGrantPermission}>
            Ajouter un validateur
          </button>
        </div>
      </div>
    </div>
  );
}
