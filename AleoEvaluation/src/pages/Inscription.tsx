
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { WalletNotConnectedError } from "@demox-labs/aleo-wallet-adapter-base";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";

import { supabase } from '../lib/supabase';



export default function Inscription() {
  const { publicKey, requestRecords} = useWallet();
  const [doc_id, setId] = useState('');

  const handlePrintInfo = async (doc_id : string) => {

    const { data, error } = await supabase
          .from('information')
          .select('*')
          .eq('id', doc_id)
          .maybeSingle();
    
    if(!data){
      //The user don't have any files to his names
      return;
    }
    
    
  
  }

  const onClick = async () => {
    const program = "permission_granthack.aleo";
    if (!publicKey) throw new WalletNotConnectedError();

    if (requestRecords) {
      const records = await requestRecords(program);
      console.log("Records bruts:", records);
      const firstDocId = records[0]?.data?.doc_id;

      console.log(firstDocId);

      setId(firstDocId);
  }
  };
      
  const handleValidate = async () => {

    const {error:Updateerror} = await supabase
        .from('Information')
        .update({ Check : true})
        .eq('id', doc_id)

    if(Updateerror){
      console.error('Erreur Supabase:', Updateerror.message);
      alert("Error");
      return;
    }
  }

  

  return (
    <div className="account-page">
        <div className="content ">

          <button onClick={onClick} disabled={!publicKey}>
            Request Records
          </button>

          <button onClick={handleValidate} disabled={!publicKey}>
            Validate The Data
          </button>
          
        </div>
      </div>
  );
}