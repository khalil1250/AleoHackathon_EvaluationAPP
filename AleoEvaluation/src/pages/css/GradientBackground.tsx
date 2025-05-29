import React, { useEffect, useRef } from 'react';
import './gradient.css';

export default function GradientBackground() {
  const fadeRef = useRef<HTMLDivElement>(null);

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

  return (
    <>
      <div className="gradient-layer1" />
      <div className="gradient-layer2" ref={fadeRef} />
    </>
  );
}
