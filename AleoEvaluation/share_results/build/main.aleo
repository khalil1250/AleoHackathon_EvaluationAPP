program share_results.aleo;

record ResultEval:
    owner as address.private;
    resulteval as field.private;
    from_entreprise as address.private;

function calcul_event:
    input r0 as field.private;
    input r1 as field.private;
    input r2 as address.private;
    input r3 as address.private;
    div r0 r1 into r4;
    cast r2 r4 r3 into r5 as ResultEval.record;
    output r5 as ResultEval.record;
