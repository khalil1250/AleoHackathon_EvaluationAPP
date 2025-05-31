// The 'permission_granterHack' program.
program permission_granterhack.aleo {

    const BLOCK_MARGIN: u32 = 20u32;

    record DocumentPermission{
    doc_id: field,
    reader: address,
    owner: address,
    block_height: u32
}
// Fonction qui crée et retourne une permission
// https://api.explorer.provable.com/v1/testnet/block/height/latest
async transition grant_permission(doc_id: field, reader: address, owner: address, public block_height: u32) -> (DocumentPermission, Future) {
    let permission = DocumentPermission { doc_id, reader, owner, block_height };
    let grant_permission_future: Future = finalize_grant_permission(block_height);
    return (permission, grant_permission_future);
}
async function finalize_grant_permission(block_height: u32){
    assert(block.height >= block_height);
    assert(block.height <= block_height + BLOCK_MARGIN);
}



    transition main(public a: u32, b: u32) -> u32 {
        let c: u32 = a + b;
        return c;
    }
}
