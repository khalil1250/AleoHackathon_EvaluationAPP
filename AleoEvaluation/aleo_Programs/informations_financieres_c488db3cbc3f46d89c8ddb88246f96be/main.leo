program informations_financieres_c488db3cbc3f46d89c8ddb88246f96be;

struct Informations_financieres {
    revenuAnnuel: u32,
    ebitda: u32,
    margeEbitda: field,
    resultatNet: u32,
    margeNette: field,
    cashFlowOperationnel: u32,
    cashFlowLibre: u32,
    tresorerie: u32,
    capex: u32,
    opex: u32,
    niveauEndettement: u32,
    ratioEndettement: field,
    ratioLiquiditeCourante: field,
    ratioLiquiditeImmediat: field,
    bfr: u32,
    dso: u32,
    dpo: u32,
    dureeCycleTresorerie: i32,
    returnOnAssets: field,
    returnOnEquity: field,
    ratioCouvertureInterets: field,
    coutMoyenDette: field,
    ratioDistributionDividende: u32,
    croissanceCA: field,
    croissanceEBITDA: field,
    variationStock: i32,
    ratioValorisationEVEBITDA: field,
    wacc: field,
    ratioProductivite: u32,
    coutUnitaireMoyen: field,
    prixMoyenVente: field,
    nombreClientsActifs: u32,
    tauxRetentionClient: u32,
    tauxChurnClient: u32,
    cacl: u32,
    ltv: u32,
    ratioLTVCAC: field,
    budgetR_D: u32,
    pourcentageR_DCA: field,
    coutMO: u32,
    tauxMargeBrute: u32,
    ratioChargesFixesVariables: field,
}
