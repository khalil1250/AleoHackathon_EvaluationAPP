import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './css/Accueil.css';
import { IoLogOutOutline } from 'react-icons/io5'; // Ionicons équivalent

export default function Accueil() {
  const fadeRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

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


  return (
    <div className="container">
      <div className="gradient-layer1" />
      <div className="gradient-layer2" ref={fadeRef} />
            
      

      <div className="bottom-right">
        <button className="main-button">Parameters</button>
      </div>
    </div>
  );
}
