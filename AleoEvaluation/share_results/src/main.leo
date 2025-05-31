// The 'share_results' program.
program share_results.aleo {
    // Fonction qui crée et retourne une permission

    record ResultEval{
        owner: address,
        resulteval : field,
        from_entreprise : address,
    }

    transition calcul_event(private a : field, private b : field, owner : address, from_entreprise : address) -> ResultEval {
        let resulteval : field = a/b;
        let result : ResultEval = ResultEval {owner, resulteval, from_entreprise};
        return result;
    }
}
