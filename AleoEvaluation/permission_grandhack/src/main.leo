// The 'permission_GrantHack' program.
program permission_granthack.aleo {
    record DocumentPermission{
        doc_id: field,
        reader: address,
        owner: address
    }

    // Fonction qui crée et retourne une permission
    transition grant_permission(doc_id: field, reader: address, owner: address) -> DocumentPermission {
        let permission : DocumentPermission = DocumentPermission { doc_id, reader, owner };
        return permission;
    }


}
