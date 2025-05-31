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

/** Transforme ArrayBuffer → Base64 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/** Transforme Base64 → ArrayBuffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Génère une clé AES-GCM 256 bits (CryptoKey) */
async function generateAESKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,                // exportable
    ["encrypt", "decrypt"]
  );
}

/**
 * Chiffre un objet JSON avec AES-GCM 256 bits.
 * → Renvoie :
 *    - ciphertextBase64 = Base64( IV(12 bytes) ∥ ciphertext )
 *    - rawKey = CryptoKey AES-GCM (256 bits) générée
 */
async function encryptObjectWithAES(jsonObj: any): Promise<{ ciphertextBase64: string; rawKey: CryptoKey }> {
  // 1) Générer la clé AES
  const aesKey = await generateAESKey();

  // 2) Encoder le JSON en Uint8Array
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(jsonObj));

  // 3) Générer un IV aléatoire 12 bytes
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  // 4) Chiffrement AES-GCM
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    plaintext
  );

  // 5) Concaténer IV ∥ ciphertext
  const combined = new Uint8Array(iv.byteLength + ciphertextBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertextBuffer), iv.byteLength);

  // 6) Retourner Base64
  return {
    ciphertextBase64: arrayBufferToBase64(combined.buffer),
    rawKey: aesKey
  };
}

/**
 * Derive un Key Encryption Key (KEK) à partir de la chaîne `recipient` via PBKDF2.
 *  - password = UTF8(recipient)
 *  - salt = "aleolock-salt-fixed"
 *  - iterations = 100 000
 *  - hash = SHA-256
 *  - résultante = CryptoKey AES-GCM 256 bits
 */
async function deriveKeyFromRecipient(recipient: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  // 1) Importer recipient comme clé « raw » pour PBKDF2
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(recipient),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  // 2) Paramètres PBKDF2
  const salt = encoder.encode("aleolock-salt-fixed");
  const iterations = 100_000;

  // 3) Deriver un KEK (AES-GCM 256 bits)
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

/**
 * Wrap (chiffre) la clé AES rawKey à l’aide d’un KEK dérivé du `recipient`.
 * → Renvoie Base64( IV2(12 bytes) ∥ ciphertext2 ), où ciphertext2 = AES-GCM(Kek, rawKeyRaw).
 */
async function wrapAESKeyWithRecipient(rawAesKey: CryptoKey, recipient: string): Promise<string> {
  // 1) Dériver le KEK
  const kek = await deriveKeyFromRecipient(recipient);

  // 2) Exporter rawAesKey en ArrayBuffer (32 bytes)
  const rawKeyBuffer = await window.crypto.subtle.exportKey("raw", rawAesKey);

  // 3) Générer IV aléatoire 12 bytes
  const iv2 = window.crypto.getRandomValues(new Uint8Array(12));

  // 4) Chiffrer le rawKeyBuffer avec le KEK
  const ciphertext2Buffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv2 },
    kek,
    rawKeyBuffer
  );

  // 5) Concaténer iv2 ∥ ciphertext2
  const combined2 = new Uint8Array(iv2.byteLength + ciphertext2Buffer.byteLength);
  combined2.set(iv2, 0);
  combined2.set(new Uint8Array(ciphertext2Buffer), iv2.byteLength);

  // 6) Retourner Base64
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

  // Récupération du contexte wallet Aleo
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

  // ──────────── 2.4. Grant Permission Aleo (inchangé) ────────────
  const handleGrantPermission = async () => {
    if (!publicKey) {
      setTxStatus("Wallet non connecté");
      throw new WalletNotConnectedError();
    }
    if (!recipient) {
      setTxStatus("Adresse destinataire manquante");
      return;
    }
    try {
      const fee = 50_000;
      const doc_id = "123456789123456789field"; // identifiant de doc, à adapter

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
    } catch (err) {
      console.error("Erreur chiffrement AES du JSON :", err);
      alert("Impossible de chiffrer le JSON.");
      return;
    }

    // 5) Envelopper (wrap) la clé AES avec PBKDF2(recipient)
    let cle_crypte: string;
    try {
      cle_crypte = await wrapAESKeyWithRecipient(rawAesKey, recipient);
    } catch (err) {
      console.error("Erreur wrap AES Key :", err);
      alert("Impossible de chiffrer la clé AES par PBKDF2(recipient).");
      return;
    }

    // 6) Insérer dans Supabase
    const { error } = await supabase
      .from('information')
      .insert([
        {
          name: file.name,
          cle_crypte: cle_crypte,             // Base64(iv2 ∥ ciphertext2)
          company_id: companyId,
          fichier_crypt: ciphertextBase64,    // Base64(iv ∥ ciphertext)
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

          {/* Ajouter un validateur (permission Aleo) */}
          <input
            className="inputform"
            placeholder="Adresse Aleo du validateur (aleo1…)"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />
          <button className="valid" onClick={handleGrantPermission}>
            Ajouter un validateur
          </button>

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
        </div>
      </div>
    </div>
  );
}
