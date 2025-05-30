// The 'evaluate_data' program.

program evaluate_data.aleo {

    record OffChainNFT {
        owner : address,
        provider : address,
        hash_datapt : field,
        hash_metadata : field
    }

    transition mint_access_nft (private validator_address : address, private provider : address, hash_datapt : field, hash_metadata : field) -> OffChainNFT {
        //Fonction permettant a l'entreprise de créer des accès a la data aux validateurs
        
        let new_token : OffChainNFT = OffChainNFT{
            owner : validator_address,
            provider : provider,
            hash_datapt : hash_datapt,
            hash_metadata : hash_metadata
        };
        return new_token;
    }

    transition prove_ownership(private nft : OffChainNFT, public expected_result_hash : field) -> bool{

        //Cette fct génére un code ZK qui prouvera que le code a bien été exécuté par le validateur

        //On vérifie que le hash correspond
        assert_eq(nft.hash_datapt, expected_result_hash);

        //On vérifie que le owner est bien le caller
        assert_eq(nft.owner, self.caller);

        return true;
    }

    transition prove_data(private nft : OffChainNFT, public expected_result_hash : field, s : signature) -> bool{

        //Cette fct génére un code ZK qui prouvera que les données ont bien été validé et signé par le validateur

        //On vérifie que le hash correspond
        assert_eq(nft.hash_datapt, expected_result_hash);

        //On vérifie que le owner est bien le caller
        assert_eq(nft.owner, self.caller);

        // Vérifie que le validateur est bien celui attendu
        assert(signature::verify(s, self.caller, nft.owner));

        return true;

    }
}
