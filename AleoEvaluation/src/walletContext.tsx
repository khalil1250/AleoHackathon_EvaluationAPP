// src/context/WalletContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useWallet } from '@demox-labs/aleo-wallet-adapter-react';

type WalletContextType = {
  publicKey: string | null;
};

const WalletContext = createContext<WalletContextType>({
  publicKey: null,
});

export const WalletProviderContext = ({ children }: { children: React.ReactNode }) => {
  const { publicKey } = useWallet();
  const [key, setKey] = useState<string | null>(null);

  useEffect(() => {
    if (publicKey) {
      setKey(publicKey.toString());
    }
  }, [publicKey]);

  return (
    <WalletContext.Provider value={{ publicKey: key }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useAleoWallet = () => useContext(WalletContext);
