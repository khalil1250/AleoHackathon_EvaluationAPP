
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { WalletNotConnectedError } from "@demox-labs/aleo-wallet-adapter-base";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";



export default function Inscription() {
  const { publicKey, requestRecords} = useWallet();
  console.log({publicKey});
  const onClick = async () => {
    const program = "permission_granthack.aleo";
    if (!publicKey) throw new WalletNotConnectedError();

    if (requestRecords) {
      const records = await requestRecords(program);
      console.log("Records bruts:", records);
      
}

  };
  return (
    <div className="account-page">
        <div className="content ">

          <button onClick={onClick} disabled={!publicKey}>
            Request Records
          </button>
          
        </div>
      </div>
  );
}