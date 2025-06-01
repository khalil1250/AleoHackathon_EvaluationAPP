import { useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { supabase } from '../lib/supabase';;
import './css/Accueil.css';
import GradientBackground from './css/GradientBackground';

export default function Index() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const handleuser = async() => {
      const walletAddress = publicKey?.toString();


      // Vérifie si l'utilisateur existe déjà
      const { data: existingUser, error } = await supabase
        .from('Users')
        .select('*')
        .eq('address', walletAddress)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erreur lors de la vérif de l'utilisateur :", error.message);
        return;
      }

      console.log(walletAddress);

      if (!existingUser) {
        const { error: insertError } = await supabase.from('Users').insert([
          {
            address: walletAddress,
          }
        ]);

        if (insertError) {
          console.error("Erreur lors de l'insertion :", insertError.message);
          return;
        }

        
      }

    }
    
  useEffect(() => {

    if (connected && publicKey) {
      console.log('Connecté à :', publicKey.toString());
      handleuser();
      navigate('/Acceuil'); // redirige vers la page d’accueil Aleo
    }
  }, [connected, publicKey]);

  return (
    <div className="accueil-page">
      <div className="container">
        <GradientBackground />
        <div className="content">
        <WalletMultiButton />
      </div>
      </div>
    </div>
  );
}
