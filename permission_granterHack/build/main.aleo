program permission_granterhack.aleo;

record DocumentPermission:
    owner as address.private;
    doc_id as field.private;
    reader as address.private;

function grant_permission:
    input r0 as field.private;
    input r1 as address.private;
    input r2 as address.private;
    cast r2 r0 r1 into r3 as DocumentPermission.record;
    output r3 as DocumentPermission.record;

function main:
    input r0 as u32.public;
    input r1 as u32.private;
    add r0 r1 into r2;
    output r2 as u32.private;
