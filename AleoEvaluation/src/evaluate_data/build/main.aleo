program evaluate_data.aleo;

record OffChainNFT:
    owner as address.private;
    provider as address.private;
    hash_datapt as field.private;
    hash_metadata as field.private;

function mint_access_nft:
    input r0 as address.private;
    input r1 as address.private;
    input r2 as field.private;
    input r3 as field.private;
    cast r0 r1 r2 r3 into r4 as OffChainNFT.record;
    output r4 as OffChainNFT.record;

function prove_ownership:
    input r0 as OffChainNFT.record;
    input r1 as field.public;
    assert.eq r0.hash_datapt r1;
    assert.eq r0.owner self.caller;
    output true as boolean.private;

function prove_data:
    input r0 as OffChainNFT.record;
    input r1 as field.public;
    input r2 as signature.private;
    assert.eq r0.hash_datapt r1;
    assert.eq r0.owner self.caller;
    sign.verify r2 self.caller r0.owner into r3;
    assert.eq r3 true;
    output true as boolean.private;
