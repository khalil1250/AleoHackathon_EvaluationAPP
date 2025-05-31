import { useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { supabase } from '../lib/supabase';

export default function Index() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  const handleuser = async() => {
      const walletAddress = publicKey?.toString().trim();
      if (!walletAddress) return;


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
            address: walletAddress
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
    <div className="index-page">
      <div className="container">
        <h1>Connecte ton wallet Aleo</h1>
        <WalletMultiButton />
      </div>
    </div>
  );
}
