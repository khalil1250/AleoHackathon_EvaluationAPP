import React, { use, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Accueil.css';
import GradientBackground from './css/GradientBackground';
import { IoLogOutOutline } from 'react-icons/io5'; // Ionicons équivalent
import { WalletMultiButton } from '@demox-labs/aleo-wallet-adapter-reactui';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';


export default function Accueil() {

  const fadeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { connected } = useWallet();

  useEffect(() => {
  if ( !connected ) {
    navigate('/'); // redirige vers la page d’accueil Aleo
  }
  }, [connected]);

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
  };

  const buttons = [
    { title: 'Send Info', onClick: () => {navigate("SendInfo")} },
    { title: 'See Info', onClick: () => {navigate("SeeInfo")} },
    { title: 'Evaluations', onClick: () => {} },
    { title: 'Account', onClick: () => {navigate("Account")} },
    { title : 'Validateur', onClick : () => {navigate("Inscription")}},
  ];

  return (
      <div className="accueil-page">
    <div className="container">


      <GradientBackground />

      <div className="content">
        <WalletMultiButton />
        {buttons.map((btn, idx) => (
          <button key={idx} className="main-button" onClick={btn.onClick}>
            {btn.title}
          </button>
        ))}
      </div>

      <div className="bottom-right">
        <button className="main-button">Parameters</button>
      </div>
    </div>
  </div>
  );
}