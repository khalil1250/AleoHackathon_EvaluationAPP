// src/pages/Inscription.tsx

import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletNotConnectedError, WalletAdapterNetwork} from "@demox-labs/aleo-wallet-adapter-base";
import { supabase } from "../lib/supabase";
import {
  Transaction
} from "@demox-labs/aleo-wallet-adapter-base";

import GradientBackground from './css/GradientBackground';
import './css/Account.css';
import {IoArrowBackOutline } from 'react-icons/io5';

/** ───────────── Helpers Web Crypto ───────────── */

/** Transforme une chaîne Base64 en ArrayBuffer. */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Importe un ArrayBuffer (32 octets) en CryptoKey AES-GCM 256 bits pour le décryptage. */
async function importAesKeyFromRaw(rawKeyBuffer: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    rawKeyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

/**
 * Déchiffre un ciphertext AES-GCM encodé en Base64 (IV (12 octets) ∥ ciphertext).
 * @param ciphertextBase64  Base64(IV∥ciphertext)
 * @param aesKey            CryptoKey AES-GCM pour décryptage
 * @returns                 Chaîne UTF-8 (JSON) en clair
 */
async function decryptAesGcmFromBase64(
  ciphertextBase64: string,
  aesKey: CryptoKey
): Promise<string> {
  // 1) Convertir Base64 en ArrayBuffer
  const combinedBuffer = base64ToArrayBuffer(ciphertextBase64);
  const combinedBytes = new Uint8Array(combinedBuffer);

  // 2) Extraire l’IV (12 octets) et le ciphertext (le reste)
  const iv = combinedBytes.slice(0, 12);
  const ciphertextBytes = combinedBytes.slice(12);

  // 3) Déchiffrer avec AES-GCM
  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertextBytes.buffer
  );

  // 4) Convertir ArrayBuffer en chaîne UTF-8
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBuffer);
}

/**
 * Extrait la partie numérique d'un doc_id de la forme "12345field.private".
 * @param docId  Chaîne commençant par chiffres (avant "field.private")
 * @returns      BigInt de la partie numérique, sinon 0n
 */
function extractNumericDocId(docId: string): bigint {
  const match = /^(\d+)/.exec(docId);
  if (!match) return 0n;
  try {
    return BigInt(match[1]);
  } catch {
    return 0n;
  }
}

/**
 * Trie un tableau de records par data.doc_id (partie numérique) en ordre décroissant.
 */
function sortRecordsByNumericDocIdDesc<T extends { data: { doc_id: string } }>(
  records: T[]
): T[] {
  return [...records].sort((a, b) => {
    const numA = extractNumericDocId(a.data.doc_id);
    const numB = extractNumericDocId(b.data.doc_id);
    if (numA < numB) return 1;
    if (numA > numB) return -1;
    return 0;
  });
}

/** ───────────── Composant Inscription ───────────── */
export default function Inscription() {
  const { publicKey, connected,requestRecords, requestTransaction } = useWallet();
  // docIdWithSuffix contiendra par exemple "12345field.private"
  const [docIdWithSuffix, setDocIdWithSuffix] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>('');
  const [recipient, setRecipient] = useState<string>(''); // adresse Aleo du hedge_funds
  const [args1, setargs1] = useState<string>(''); // adresse Aleo du hedge_funds
  const [args2, setargs2] = useState<string>(''); // adresse Aleo du hedge_funds
  const navigate = useNavigate();

  /**
   * 1. Récupère les records du programme Aleo,
   * 2. Les trie en décroissant par data.doc_id numérique,
   * 3. Affiche le résultat trié dans la console,
   * 4. Déchiffre le JSON du premier record.
   */
  const askRecords = async () => {
    const program = "permission_granthack.aleo";
    if (!publicKey) throw new WalletNotConnectedError();
    if (!requestRecords) {
      console.error("La fonction requestRecords n'est pas disponible.");
      return;
    }

    // 1) Récupérer tous les records du programme
    const records = await requestRecords(program);
    console.log("Records bruts :", records);

    // 2) Trier en décroissant selon data.doc_id numérique
    const triDesc = sortRecordsByNumericDocIdDesc(records as any);
    console.log("Records triés (décroissant) :", triDesc);

    // 3) Prendre le premier doc_id trié (par ex. "12345field.private")
    const firstDocId = triDesc[0]?.data?.doc_id ?? "";
    if (!firstDocId) {
      console.warn("Aucun doc_id trouvé dans les records.");
      return;
    }
    console.log("Premier doc_id après tri :", firstDocId);
    setDocIdWithSuffix(firstDocId);

    // 4) Récupérer la ligne Supabase et déchiffrer
    await handleRecord(firstDocId);
  };

  /**
   * 2. Récupère la ligne "information" pour docIdWithSuffix,
   *    déchiffre fichier_crypt avec cle_crypte, et log le JSON.
   */
  const handleRecord = async (docIdWithSuffix: string) => {
    try {
      // 1) Supprime "field.private" si nécessaire
      let pureIdStr = docIdWithSuffix;
      if (pureIdStr.endsWith("field.private")) {
        pureIdStr = pureIdStr.replace(/field\.private$/, "");
      }
      console.log("ID sans suffixe (pour SELECT) :", pureIdStr);

      // 2) Récupérer la ligne correspondante de Supabase
      const { data: infoRow, error: fetchError } = await supabase
        .from("information")
        .select("fichier_crypt, cle_crypte, valide")
        .eq("id", pureIdStr)
        .maybeSingle();

      console.log("clés récupérées:", infoRow);
      if (fetchError) {
        console.error("Erreur Supabase (fetch ligne) :", fetchError.message);
        return;
      }
      if (!infoRow) {
        console.warn(`Aucune entrée "information" pour id = ${pureIdStr}`);
        return;
      }

      const { fichier_crypt, cle_crypte } = infoRow;
      if (!fichier_crypt || !cle_crypte) {
        console.warn("Les champs fichier_crypt ou cle_crypte sont vides.");
        return;
      }

      // 3) Importer la clé AES (Base64 → ArrayBuffer → CryptoKey)
      const rawKeyBuffer = base64ToArrayBuffer(cle_crypte);
      const aesKey = await importAesKeyFromRaw(rawKeyBuffer);

      // 4) Déchiffrer le JSON
      const jsonString = await decryptAesGcmFromBase64(fichier_crypt, aesKey);

      let jsonObj;
      try {
        jsonObj = JSON.parse(jsonString);
      } catch (e) {
        console.error("Le texte déchiffré n'est pas un JSON valide :", e);
        return;
      }
      console.log("JSON déchiffré pour doc_id =", docIdWithSuffix, ":", jsonObj);
    } catch (err) {
      console.error("Erreur dans handleRecord :", err);
    }
  };

  /**
   * 3. Met à jour la colonne `valide` à `true` dans la table information
   *    pour la ligne dont l’id numérique (sans suffixe) correspond.
   */
  const handleValidate = async () => {
    if (!docIdWithSuffix) {
      alert("Aucun doc_id défini. Cliquez d'abord sur 'Request Records'.");
      return;
    }

    // 1) Supprime "field.private" si présent
    let pureIdStr = docIdWithSuffix;
    if (pureIdStr.endsWith("field.private")) {
      pureIdStr = pureIdStr.replace(/field\.private$/, "");
    }
    console.log("ID sans suffixe (pour UPDATE) :", pureIdStr);

    // 2) Récupérer d'abord le champ 'valide' pour vérifier s’il est déjà true
    const { data: existingRow, error: fetchError } = await supabase
      .from("information")
      .select("valide")
      .eq("id", pureIdStr)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur Supabase (fetch pour validate) :", fetchError.message);
      return;
    }
    if (!existingRow) {
      console.warn(`Aucune entrée "information" pour id = ${pureIdStr}`);
      return;
    }

    // 3) Si déjà validée, afficher un message
    if (existingRow.valide) {
      alert("Information déjà validée");
      return;
    }

    // 4) Sinon, mettre à jour le champ 'valide' à true
    const { error: updateError } = await supabase
      .from("information")
      .update({ valide: true })
      .eq("id", pureIdStr);

    if (updateError) {
      console.error("Erreur Supabase (validation) :", updateError.message);
      alert("Erreur lors de la validation en base : " + updateError.message);
      return;
    }

    alert("Ce record a été validé avec succès !");
  };

  const handleShareResult = async () => {
      if (!publicKey) {
        setTxStatus("Wallet non connecté");
        console.log("nooo")
        throw new WalletNotConnectedError();

      }

      const fee = 50_000;
      const tx = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta,
        'share_results.aleo',
        'calcul_event',
        [args1, args2, recipient, publicKey.toString()],
        fee,
        false
      );


      if (!requestTransaction) {
        console.log("error");
        setTxStatus("Impossible d'envoyer la transaction : fonction manquante");
        return;
      }

      setTxStatus("Envoi de la transaction en cours...");
      const result = await requestTransaction(tx);
      console.log('Résultat transaction :', result);
      setTxStatus("✅ Permission envoyée !");

    };

  useEffect(() => {
    if ( !connected ) {
      navigate('/'); // redirige vers la page d’accueil Aleo
    }
    }, [connected]);
  const handleBack = () => {
    navigate('/Acceuil');
  };

  return (
    <div className="account-page">
      <div className="container">
        <GradientBackground/>
        <button className="back-button" onClick={handleBack}>
                  <IoArrowBackOutline size={24} />
              </button>
        
        <div className="content">

        <button className="valid" onClick={askRecords} disabled={!publicKey}>
          Request Records et Déchiffrer
        </button>
        <button className="valid" onClick={handleValidate} disabled={!publicKey || !docIdWithSuffix}>
          Validate The Data
        </button>

        <input
            className="inputform"
            placeholder="Adresse du hedge_funds"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
          />

        <input
            className="inputform"
            placeholder="args1"
            value={args1}
            onChange={(e) => setargs1(e.target.value)}
          />

          <input
            className="inputform"
            placeholder="args2"
            value={args2}
            onChange={(e) => setargs2(e.target.value)}
          />

        <button className="valid" onClick={handleShareResult}>
          Sharedata
        </button>
        </div>
      </div>
    </div>
  );
}
