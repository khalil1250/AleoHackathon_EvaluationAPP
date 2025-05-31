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


export default function Account() {
    const fadeRef = useRef<HTMLDivElement>(null);
    const [company_name, setCompanyName] = useState('');

    const navigate = useNavigate();

    const [recipient, setRecipient] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const { publicKey, requestTransaction } = useWallet();

    

    const handleLogout = () => {
        navigate('/');
        return;
    };
    const handleBack = () => {
        navigate('/Acceuil');
        return;
    }

    const handleCompany = async () => {
        try{
            const walletAddress = publicKey?.toString();
            const { data, error } = await supabase
              .from('Users')
              .select('*')
              .eq('address', walletAddress)
              .single();

            if (error) {
                console.error('Erreur Supabase:', error.message);
                alert("Error recup info");
                return;
            }

            //Pour créer une entreprise la compagyId du user doit etre nul
            if(!data.company_id){
                const {error:error1} = await supabase.from('company').insert([
                    { 
                        name : company_name,
                        owner_id : data.id
                    }
                ]);

                if (error1) {
                    alert('Erreur lors de la création de la company dans la base de donnée');
                    return;
                }

                console.log(data.id);

                const { data: CompanyData, error: ErrorCompany } = await supabase
                    .from('company')
                    .select('*')
                    .eq('owner_id', data.id)
                    .single()

                if (ErrorCompany) {
                    console.error('Erreur Supabase:', ErrorCompany.message);
                    alert("Error recup info entreprise");
                    return;
                }

                const c_id = CompanyData.id;

                const {error:Updateerror} = await supabase
                    .from('Users')
                    .update({ company_id: c_id})
                    .eq('address', publicKey?.toString())

                if(Updateerror){
                    console.error('Erreur Supabase:', Updateerror.message);
                    alert("Error Update in users");
                    return;
                }

            }
            else{
                alert("Vous êtes déjà associé à une entreprise");
            }

            }catch{


        }
      };

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


    //Code Censé envoyer un token permission a un autre user.
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
      const fee = 50_000; // ajuste au besoin
      const doc_id = "123456789123456789field"; // exemple — tu peux le remplacer par un hash

      const tx = Transaction.createTransaction(
        publicKey,
        WalletAdapterNetwork.TestnetBeta, 
        'permission_granthack.aleo',     // ton programme .aleo
        'grant_permission',            // ta fonction Aleo
        [doc_id, publicKey.toString(), recipient], // les 3 inputs
        fee, 
        false
      );

      if (!requestTransaction) {
        setTxStatus("Impossible d'envoyer la transaction : fonction manquante");
        return;
      }

      setTxStatus("Envoi de la transaction en cours...");

      const result = await requestTransaction(tx);
      console.log('Résultat transaction:', result);
      setTxStatus("✅ Permission envoyée !");
    } catch (err) {
      console.error(err);
      setTxStatus("❌ Erreur lors de l'envoi");
    }
  }


    return (
        <div className="account-page">
    <div className="container">
      <GradientBackground />
      <button className="logout-button" onClick={handleLogout}>
              <IoLogOutOutline size={24} />
            </button>
    <button className="back-button" onClick={handleBack}>
                <IoArrowBackOutline size={24} />
              </button>
      <div className="content">
        <input
          className="inputform"
          placeholder="Nom de votre entreprise"
          value={company_name}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <button className="valid" onClick={handleCompany}>
          Ajouter votre entreprise
        </button>

        <input
          className="inputform"
          placeholder="adress_validateur"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        <button className="valid" onClick={handleGrantPermission}>
          Ajouter un validateur
        </button>

        

      </div>
    </div>
  </div>
    );
}