import { useEffect } from 'react';

import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import {
  WalletNotConnectedError
} from "@demox-labs/aleo-wallet-adapter-base";
import { useNavigate } from 'react-router-dom';
import './css/Accueil.css';
import GradientBackground from './css/GradientBackground';
import {IoArrowBackOutline } from 'react-icons/io5';


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

     const handleBack = () => {
    navigate('/Acceuil');
  };
   
    return(
        <div className="accueil-page">
          
        <div className="container ">
          <GradientBackground />

          <button className="back-button" onClick={handleBack}>
                    <IoArrowBackOutline size={24} />
                  </button>
        <div className="content ">
          
        <button className="main-button" onClick={handleLaunchEval}>
            Récuperer des infos
        </button>
        
        </div>
      </div>
      </div>
    );
}