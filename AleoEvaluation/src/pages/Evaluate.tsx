import React, { useState, useEffect, useRef } from 'react';







export default function Evaluate(){

    const [company_id, setCompanyName] = useState('');

    const handleLaunchEval = async () => {
            
    }

    return(
        <div className="account-page">
        <div className="content ">
        <input
          className="inputform"
          placeholder="Nom de votre entreprise"
          value={company_id}
          onChange={(e) => setCompanyName(e.target.value)}
        />
        <button className="valid" onClick={handleLaunchEval}>
          Ajouter votre entreprise
        </button>
        
        </div>
      </div>
    );
}