import { useEffect } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';
import { useNavigate } from 'react-router-dom';
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';

export default function Index() {
  const { publicKey, connected } = useWallet();
  const navigate = useNavigate();

  useEffect(() => {
    if (connected && publicKey) {
      console.log('Connecté à :', publicKey.toString());
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
