// src/pages/Inscription.tsx

<<<<<<< HEAD
import React, { useState, useEffect } from "react";
=======
import { useState, useEffect} from "react";
>>>>>>> origin/deb_t
import { useNavigate } from "react-router-dom";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";
import {
  WalletNotConnectedError,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import { supabase } from "../lib/supabase";
import { Transaction } from "@demox-labs/aleo-wallet-adapter-base";

<<<<<<< HEAD
import GradientBackground from "./css/GradientBackground";
import "./css/Account.css";
import { IoArrowBackOutline } from "react-icons/io5";
=======
import GradientBackground from './css/GradientBackground';
import './css/Account.css';
import {IoArrowBackOutline } from 'react-icons/io5';
>>>>>>> origin/deb_t

/** ───────────── Helpers Web Crypto ───────────── */

/** Transforme Base64 → ArrayBuffer */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/** Import CryptoKey AES-GCM 256 bits */
async function importAesKeyFromRaw(rawKeyBuffer: ArrayBuffer): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    rawKeyBuffer,
    { name: "AES-GCM" },
    false,
    ["decrypt"]
  );
}

/** Déchiffre AES-GCM(IV∥ciphertext) encodé en Base64 → string JSON */
async function decryptAesGcmFromBase64(
  ciphertextBase64: string,
  aesKey: CryptoKey
): Promise<string> {
  const combinedBuffer = base64ToArrayBuffer(ciphertextBase64);
  const combinedBytes = new Uint8Array(combinedBuffer);
  const iv = combinedBytes.slice(0, 12);
  const ciphertextBytes = combinedBytes.slice(12);

  const plaintextBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    aesKey,
    ciphertextBytes.buffer
  );

  return new TextDecoder().decode(plaintextBuffer);
}

/** Extrait la partie numérique d’un doc_id comme "12345field.private" → 12345n */
function extractNumericDocId(docId: string): bigint {
  const match = /^(\d+)/.exec(docId);
  if (!match) return 0n;
  try {
    return BigInt(match[1]);
  } catch {
    return 0n;
  }
}

/** Trie un tableau de records par data.doc_id (numérique) décroissant */
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
  const { publicKey, connected, requestRecords, requestTransaction } = useWallet();
  const [docIdWithSuffix, setDocIdWithSuffix] = useState<string>("");
  const [txStatus, setTxStatus] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [args1, setArgs1] = useState<string>("");
  const [args2, setArgs2] = useState<string>("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!connected) {
      navigate("/"); // renvoie à l'accueil si le wallet n'est pas connecté
    }
  }, [connected, navigate]);

  /**
   * 1. Récupère les records du programme Aleo,
   * 2. Trie décroissant par data.doc_id numérique,
   * 3. Déchiffre le JSON du premier record,
   * 4. Télécharge directement ce JSON.
   */
  const askRecords = async () => {
    if (!publicKey) {
      alert("Veuillez connecter votre wallet Aleo.");
      throw new WalletNotConnectedError();
    }
    if (!requestRecords) {
      console.error("La fonction requestRecords n'est pas disponible.");
      return;
    }

    try {
      const program = "permission_granthack.aleo";

      // 1) Récupérer tous les records
      const records = await requestRecords(program);
      console.log("Records bruts :", records);

      if (!records || records.length === 0) {
        alert("Aucun token trouvé pour ce programme.");
        return;
      }

      // 2) Trier décroissant par data.doc_id
      const triDesc = sortRecordsByNumericDocIdDesc(records as any);
      console.log("Records triés (décroissant) :", triDesc);

      // 3) Prendre le premier doc_id
      const firstDocId = triDesc[0]?.data?.doc_id ?? "";
      if (!firstDocId) {
        alert("Impossible de récupérer le dernier token.");
        return;
      }
      console.log("Premier doc_id après tri :", firstDocId);
      setDocIdWithSuffix(firstDocId);

      // 4) Déchiffrer et retourner l'objet JSON
      const decryptedObj = await handleRecord(firstDocId);
      if (decryptedObj) {
        // 5) Créer un Blob et déclencher le téléchargement automatique
        const jsonString = JSON.stringify(decryptedObj, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `token-${firstDocId.replace(/field\.private$/, "")}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Erreur durant askRecords :", err);
      alert("Une erreur est survenue lors de la récupération du token.");
    }
  };

  /**
   * Récupère la ligne Supabase pour docIdWithSuffix,
   * déchiffre fichier_crypt avec cle_crypte, retourne l’objet JSON.
   * Téléchargement possible même si `valide === true`.
   */
  const handleRecord = async (docIdWithSuffix: string): Promise<object | null> => {
    try {
      // Supprime "field.private" si présent
      let pureIdStr = docIdWithSuffix;
      if (pureIdStr.endsWith("field.private")) {
        pureIdStr = pureIdStr.replace(/field\.private$/, "");
      }
      console.log("ID sans suffixe (SELECT) :", pureIdStr);

      // Récupérer la ligne Supabase
      const { data: infoRow, error: fetchError } = await supabase
        .from("information")
        .select("fichier_crypt, cle_crypte, valide")
        .eq("id", pureIdStr)
        .maybeSingle();

      console.log("Clés récupérées :", infoRow);
      if (fetchError) {
        console.error("Erreur Supabase (fetch ligne) :", fetchError.message);
        return null;
      }
      if (!infoRow) {
        console.warn(`Aucune entrée "information" pour id=${pureIdStr}`);
        return null;
      }

      const { fichier_crypt, cle_crypte, valide } = infoRow;
      if (!fichier_crypt || !cle_crypte) {
        console.warn("Champs cryptés manquants.");
        return null;
      }

      // Note : même si valide === true, on poursuit pour permettre le téléchargement
      if (valide) {
        console.log("Le token est déjà validé, mais le JSON sera tout de même téléchargé.");
      }

      // Importer la clé AES
      const rawKeyBuffer = base64ToArrayBuffer(cle_crypte);
      const aesKey = await importAesKeyFromRaw(rawKeyBuffer);

      // Déchiffrer le JSON
      const jsonString = await decryptAesGcmFromBase64(fichier_crypt, aesKey);

      let jsonObj;
      try {
        jsonObj = JSON.parse(jsonString);
      } catch (e) {
        console.error("Le texte déchiffré n’est pas un JSON valide :", e);
        alert("Le contenu déchiffré n’est pas un JSON valide.");
        return null;
      }

      console.log("JSON déchiffré pour doc_id =", docIdWithSuffix, ":", jsonObj);
      return jsonObj;
    } catch (err) {
      console.error("Erreur dans handleRecord :", err);
      alert("Erreur lors du déchiffrement.");
      return null;
    }
  };

  /**
   * Met à jour `valide = true` dans Supabase, si besoin.
   */
  const handleValidate = async () => {
    if (!docIdWithSuffix) {
      alert("Aucun doc_id défini. Cliquez d'abord sur 'Request Records'.");
      return;
    }

    let pureIdStr = docIdWithSuffix;
    if (pureIdStr.endsWith("field.private")) {
      pureIdStr = pureIdStr.replace(/field\.private$/, "");
    }
    console.log("ID sans suffixe (UPDATE) :", pureIdStr);

    // Vérifier `valide`
    const { data: existingRow, error: fetchError } = await supabase
      .from("information")
      .select("valide")
      .eq("id", pureIdStr)
      .maybeSingle();

    if (fetchError) {
      console.error("Erreur Supabase (fetch pour validate) :", fetchError.message);
      alert("Erreur lors de la vérification en base.");
      return;
    }
    if (!existingRow) {
      alert(`Aucune entrée "information" pour id=${pureIdStr}`);
      return;
    }

    if (existingRow.valide) {
      alert("Information déjà validée");
      return;
    }

    // Mettre à jour `valide`
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

  /**
   * Effectue une transaction Aleo “share_results.aleo::calcul_event”
   */
  const handleShareResult = async () => {
    if (!publicKey) {
      setTxStatus("Wallet non connecté");
      throw new WalletNotConnectedError();
    }

    const fee = 50_000;
    const tx = Transaction.createTransaction(
      publicKey,
      WalletAdapterNetwork.TestnetBeta,
      "share_results.aleo",
      "calcul_event",
      [args1, args2, recipient, publicKey.toString()],
      fee,
      false
    );

    if (!requestTransaction) {
      setTxStatus("Impossible d'envoyer la transaction : fonction manquante");
      return;
    }

    setTxStatus("Envoi de la transaction en cours…");
    const result = await requestTransaction(tx);
    console.log("Résultat transaction :", result);
    setTxStatus("✅ Permission envoyée !");
  };

  const handleBack = () => {
    navigate("/Acceuil");
  };

  return (
    <div className="account-page">
      <div className="container">
        <GradientBackground />
        <button className="back-button" onClick={handleBack}>
          <IoArrowBackOutline size={24} />
        </button>

        <div className="content">
          <button className="valid" onClick={askRecords} disabled={!publicKey}>
            Request Records et Déchiffrer
          </button>
          <button
            className="valid"
            onClick={handleValidate}
            disabled={!publicKey || !docIdWithSuffix}
          >
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
            onChange={(e) => setArgs1(e.target.value)}
          />
          <input
            className="inputform"
            placeholder="args2"
            value={args2}
            onChange={(e) => setArgs2(e.target.value)}
          />

          <button className="valid" onClick={handleShareResult}>
            Sharedata
          </button>

          {txStatus && <p className="tx-status">{txStatus}</p>}
        </div>
      </div>
    </div>
  );
}
