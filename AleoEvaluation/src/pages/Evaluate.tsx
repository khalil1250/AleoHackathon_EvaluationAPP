import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';


import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { WalletAdapterNetwork } from '@demox-labs/aleo-wallet-adapter-base';
import {
  Transaction,
  WalletNotConnectedError
} from "@demox-labs/aleo-wallet-adapter-base";
import { useNavigate } from 'react-router-dom';




export default function Evaluate(){

    const { publicKey, connected , requestRecords} = useWallet();
    const navigate = useNavigate();

    useEffect(() => {
    if ( !connected || !publicKey) {
    navigate('/'); // redirige vers la page d’accueil Aleo
    }
    }, [connected, publicKey]);

    if (!publicKey) return;


    const handleLaunchEval = async () => {
        const program = "share_results.aleo";
        if (!publicKey) throw new WalletNotConnectedError();

        if (requestRecords) {
        const records = await requestRecords(program);
        console.log("Records bruts:", records);


    }
    };
   
    return(
        <div className="account-page">
        <div className="content ">
        <button className="valid" onClick={handleLaunchEval}>
            Récuperer des infos
        </button>
        
        </div>
      </div>
    );
}