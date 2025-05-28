import { Outlet } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Layout() {
  const fadeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let fade = 0;
    const interval = setInterval(() => {
      if (fadeRef.current) {
        fade = fade === 1 ? 0 : 1;
        fadeRef.current.style.opacity = fade.toString();
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative min-h-screen text-white overflow-hidden">
      {/* Dégradé statique */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0F2027] via-[#1F3B73] to-[#2C5364] z-0" />

      {/* Dégradé animé superposé */}
      <div
        ref={fadeRef}
        className="absolute inset-0 bg-gradient-to-br from-[#2C5364] via-[#1F3B73] to-[#0F2027] transition-opacity duration-[4000ms] pointer-events-none z-0"
        style={{ opacity: 0 }}
      />

      {/* Contenu */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="bg-gradient-to-r from-[#1F3B73] to-[#335F99] shadow-md h-14 flex items-center px-4 z-20">
          <img
            src="/images/mailIcon.png"
            alt="Logo"
            className="w-6 h-6 mr-2"
          />
          <h1 className="text-white font-bold text-xl drop-shadow">Aleo App</h1>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
