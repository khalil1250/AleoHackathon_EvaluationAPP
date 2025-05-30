// The 'permission_granterHack' program.
program permission_granterhack.aleo {
    record DocumentPermission{
    doc_id: field,
    reader: address,
    owner: address
}
// Fonction qui crée et retourne une permission
transition grant_permission(doc_id: field, reader: address, owner: address) -> DocumentPermission {
    let permission = DocumentPermission { doc_id, reader, owner };
    return permission;
}
    transition main(public a: u32, b: u32) -> u32 {
        let c: u32 = a + b;
        return c;
    }
}
