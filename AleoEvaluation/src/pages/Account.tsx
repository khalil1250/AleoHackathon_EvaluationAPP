import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import './css/Account.css';
import { session } from '../lib/session';
import GradientBackground from './css/GradientBackground';
import { IoLogOutOutline, IoArrowBackOutline } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';


const docId = "je vais pas dormir"

export default function Account() {
    const fadeRef = useRef<HTMLDivElement>(null);
    const [company_type, setCompanyType] = useState('');
    const [company_name, setCompanyName] = useState('');
    const [company_contry, setCompanyCountry] = useState('');

    const [new_user, setNewUser] = useState('');
    const [new_user_role, setNewUserRole] = useState('');
    const [new_role, setNewRole] = useState('');
    const navigate = useNavigate();
    const username = session.username; // On récupère le username stocké lors de la connexion


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
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
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
                        country : company_contry,
                        company_type : company_type,
                        owner_username : username
                    }
                ]);

                if (error1) {
                    alert('Erreur lors de la création de la company dans la base de donnée');
                    return;
                }

                const { data : CompanyData, error : ErrorCompany} = await supabase
                    .from('company')
                    .select('*')
                    .eq('owner_username', username)
                    .single();

                if (ErrorCompany) {
                    console.error('Erreur Supabase:', ErrorCompany.message);
                    alert("Error recup info entreprise");
                    return;
                }

                const {error:error2} = await supabase.from('company_roles').insert([
                    { 
                        role_name : "owner",
                        company_id : CompanyData.company_id,
                    }
                ]);

                if (error2) {
                    alert("Erreur lors de l'ajout d'owner");
                    return;
                }

                const c_id = CompanyData.company_id;

                const { data : RoleData , error : RoleError } = await supabase
                    .from('company_roles')
                    .select('*')
                    .eq('company_id', c_id)
                    .single();

                const {error:Updateerror} = await supabase
                    .from('users')
                    .update({ company_id: c_id , role_id: RoleData.role_id})
                    .eq('username', username)

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

      const handleNewUser = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        if (error) {
            console.error('Erreur Supabase:', error.message);
            alert("Error access or user not found");
            return;
        }
        if (!data.company_id) {
            alert("Vous n'êtes pas associé à une entreprise");
            return;
        }

        const { data: data1, error:error1 } = await supabase
            .from('company_roles')
            .select('*')
            .eq('company_id', data.company_id)
            .eq("role_name", new_user_role)
            .single();
        if (error1 || !data1) {
            console.error('Erreur Supabase:', error1);
            alert("Erreur : ce role existe-t-il ?");
            return;
        }

        const {error:Updateerror} = await supabase
            .from('users')
            .update({ company_id: data.company_id, role_id : data1.role_id })
            .eq('username', new_user)

        if (Updateerror) {
            alert("Erreur lors de la création de l'ajout de l'entreprise dans la base de donnée");
            return;
        }
        
      }

    
    const [recipient, setRecipient] = useState('');
    const [txStatus, setTxStatus] = useState('');
    const { publicKey, requestTransaction } = useWallet();

    const handleGrantPermission = async () => {
      if (!publicKey || !recipient || !docId) {
        setTxStatus('Veuillez remplir tous les champs');
        return;
      }

      try {
        setTxStatus('Envoi du record en cours...');

        const tx = await requestTransaction({
          programId: 'permission_granter.aleo',
          functionName: 'grant_permission',
          fee: 1000000, // ajuster si besoin
          inputs: [docId, recipient, publicKey.toString()],
          network: WalletAdapterNetwork.TestnetBeta,
        });

        console.log('Transaction envoyée:', tx);
        setTxStatus('Permission envoyée ✅');
      } catch (error) {
        console.error(error);
        setTxStatus('Erreur lors de l\'envoi ❌');
      }
    };


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
        <input
          className="inputform"
          placeholder="Pays du siège"
          value={company_contry}
          onChange={(e) => setCompanyCountry(e.target.value)}
        />
        <input
          className="inputform"
          placeholder="type d'entreprise"
          value={company_type}
          onChange={(e) => setCompanyType(e.target.value)}
        />
        <button className="valid" onClick={handleCompany}>
          Ajouter votre entreprise
        </button>

        <input
          className="inputform"
          placeholder="Nom d'utilisateur"
          value={new_user}
          onChange={(e) => setNewUser(e.target.value)}
        />
        <input
          className="inputform"
          placeholder="Rôle de l'utilisateur"
          value={new_user_role}
          onChange={(e) => setNewUserRole(e.target.value)}
        />
        <button className="valid" onClick={handleNewUser}>
          Ajouter un utilisateur à l'entreprise
        </button>

        <input
          className="inputform"
          placeholder="adress_validateur"
          value={recipient}
          onChange={(e) => setNewRole(e.target.value)}
        />

        <button className="valid" onClick={handleGrantPermission}>
          Ajouter un validateur
        </button>

      </div>
    </div>
  </div>
    );
}