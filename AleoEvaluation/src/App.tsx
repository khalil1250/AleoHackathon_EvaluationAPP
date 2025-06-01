// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/index';
import Acceuil from './pages/Acceuil';
import Inscription from './pages/Inscription';
import Account from './pages/Account';
import Evaluate from './pages/Evaluate';


import React, { FC, useMemo } from "react";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import {
  DecryptPermission,
  WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import '@demox-labs/aleo-wallet-adapter-reactui/styles.css';


import { WalletProviderContext } from './walletContext';

export default function App() {

  const wallets = useMemo(
    () => [
      new LeoWalletAdapter({
        appName: "Leo Demo App",
      }),
    ],
    []
  );
  
  return (

    <WalletProvider
      wallets={wallets}
      decryptPermission={DecryptPermission.UponRequest}
      network={WalletAdapterNetwork.TestnetBeta}
      autoConnect
    >
    <WalletModalProvider>
      <WalletProviderContext>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/Acceuil" element={<Acceuil />} />
          <Route path="/Acceuil/Inscription" element={<Inscription />} />
          <Route path="/Acceuil/Account" element={<Account />} />
           <Route path="/Acceuil/Evaluate" element={<Evaluate />} />
        </Routes>
      </Router>
      </WalletProviderContext>
      </WalletModalProvider>
    </WalletProvider>
  );
}
Account