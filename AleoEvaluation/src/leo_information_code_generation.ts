import fs from 'fs';
import path from 'path';

const FIELD_MODULUS = 8444461749428370424248824938781546531375899335154063827935233455917409239040n;

function stringToBigInt(input: string): bigint {
  const encoder = new TextEncoder();
  const encodedBytes = encoder.encode(input);
  encodedBytes.reverse();

  let bigIntValue = BigInt(0);
  for (let i = 0; i < encodedBytes.length; i++) {
    const byteValue = BigInt(encodedBytes[i]);
    const shiftedValue = byteValue << BigInt(8 * i);
    bigIntValue = bigIntValue | shiftedValue;
  }

  return bigIntValue;
}
/*
function bigIntToString(bigIntValue: bigint): string {
  const bytes = [];
  let tempBigInt = bigIntValue;
  while (tempBigInt > BigInt(0)) {
    const byteValue = Number(tempBigInt & BigInt(255));
    bytes.push(byteValue);
    tempBigInt = tempBigInt >> BigInt(8);
  }
  bytes.reverse();
  const decoder = new TextDecoder();
  const asciiString = decoder.decode(Uint8Array.from(bytes));
  return asciiString;
}
*/
function stringToFields(input: string, numFieldElements = 4): bigint[] {
  const bigIntValue = stringToBigInt(input);
  const fieldElements = [];
  let remainingValue = bigIntValue;
  for (let i = 0; i < numFieldElements; i++) {
    const fieldElement = remainingValue % FIELD_MODULUS;
    fieldElements.push(fieldElement);
    remainingValue = remainingValue / FIELD_MODULUS;
  }
  if (remainingValue !== 0n) {
    throw new Error("String is too big to be encoded.");
  }
  return fieldElements;
}
/*
function fieldsToString(fields: bigint[]): string {
  let bigIntValue = BigInt(0);
  let multiplier = BigInt(1);
  for (const fieldElement of fields) {
    bigIntValue += fieldElement * multiplier;
    multiplier *= FIELD_MODULUS;
  }
  return bigIntToString(bigIntValue);
}
*/
function formatLeoValue(key: string, value: unknown): string {
  const leoKey = key.replace(/[^a-zA-Z0-9_]/g, '_');

  if (typeof value === 'string') {
    const encoded = stringToFields(value, 4); // Expecting 4 fields max
    return `    ${leoKey}: [${encoded.join(', ')}],`;
  }

  if (typeof value === 'boolean') {
    const val = value? "true":"false";
    return `    ${leoKey}: ${val},`;
  }

  if (typeof value === 'number') {
    if (!Number.isInteger(value)) {
      const intPart = Math.floor(value * 1000); // we take precision = 3 digits
      return `    ${leoKey}: Float{value:${intPart}i128, precision : 1000},`;
    }
    const type : string = classifyNumber(value);
    return `    ${leoKey}: ${value}${type},`;
  }
  throw new Error(`Unsupported type ${key} : ${value}`)

  
}


/**
 * Infers Leo-compatible types from JavaScript values.
 */
function inferLeoType(value: unknown): 'bool' | 'u32' | 'u64' | 'i32' | 'i64' | 'Float' | 'field' | '[field, 4]' {
  if (typeof value === 'boolean' || value === 'true' || value === 'false') {
    return 'bool';
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      try {
        return classifyNumber(value);
      } catch {
        return 'field'; // this fallback may be unreachable now
      }
    } else {
      return 'Float'; // <- NEW: Handle floats explicitly
    }
  }

  return '[field, 4]';
}



/**
 * Classifies a number as u32, u64, i32, or i64 depending on sign and size.
 */
function classifyNumber(value: number): 'u32' | 'u64' | 'i32' | 'i64' {
  const absVal = Math.abs(value);

  if (Number.isInteger(value)) {
    if (value >= 0) {
      return absVal <= 0xFFFFFFFF ? 'u32' : 'u64'; // 2^32 - 1
    } else {
      return absVal <= 0x7FFFFFFF ? 'i32' : 'i64'; // 2^31 - 1
    }
  }

  // Float fallback is handled in inferLeoType
  throw new Error('Non-integer numbers are not supported for typed classification.');
}

/**
 * Removes // line comments and  block comments  from a JSON-like string.
 */
function stripJsonComments(input: string): string {
  return input
    .replace(/\/\/.*(?=[\n\r])/g, '') // strip single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, ''); // strip block comments
}
function cleanString(input: string): string {
  // 1. Supprimer l'extension .json si elle est présente à la fin
  let result = input.replace(/\.json$/i, '');

  // 2. Transformer les caractères accentués en caractères normaux
  result = result.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Supprimer les caractères spéciaux sauf le tiret bas (_)
  result = result.replace(/[^a-zA-Z0-9_ ]/g, "");

  // 4. Supprimer les espaces en début et fin (optionnel selon usage)
  result = result.trim();

  return result;
}
function limitConcStr(base: string, company: string): string{
     const cleanBase = base.slice(0, 15);
  const cleanCompany = company.slice(0, 30 - cleanBase.length);
  return `${cleanBase}_${cleanCompany}`;
}

function formatFloat(key: string, value:unknown):string {
    
    if (typeof value === 'number' && !Number.isInteger(value)) {
        return `${key}:true,`
    } else {
      return `${key}:false,`; 
    }
}

function formatString(key: string, value:unknown):string {
    
    if (typeof value === 'string') {
        return `${key}:true,`
    } else {
      return `${key}:false,`; 
    }
}

/**
 * Converts a JSON string into a full Leo program (main.leo),
 * and saves it under ./programs/<programName>/main.leo.
 *
 * @param jsonString - Raw JSON string
 * @param companyId - Company ID to append to program name
 * @param baseName - Base name for the Leo program (e.g., "invoice")
 */
export function generateLeoProgramFromJson(jsonString: string, companyId: number | string, baseName: string): void {
  const cleanedJson = stripJsonComments(jsonString);
  baseName=cleanString(baseName);
  companyId = cleanString(companyId as string);
  console.log(baseName);
  console.log(companyId);
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleanedJson);
  } catch (error) {
    throw new Error('Invalid JSON string provided.');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Expected a JSON object (not an array or null).');
  }

  const structFields = Object.entries(parsed)
    .map(([key, value]) => {
      const leoKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
      const leoType = inferLeoType(value);
      return `    ${leoKey}: ${leoType},`;
    })
    .join('\n');
  
  const isFloatFields = Object.keys(parsed)
  .map((key) => {
    const leoKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    return `    ${leoKey}: bool,`;
  })
  .join('\n');

  const isStringFields = Object.keys(parsed)
  .map((key) => {
    const leoKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
    return `    ${leoKey}: bool,`;
  })
  .join('\n');

  const structInit = Object.entries(parsed)
  .map(([key, value]) => formatLeoValue(key, value))
  .join('\n');

  const isFloatInit = Object.entries(parsed)
  .map(([key, value]) => formatFloat(key, value))
  .join('\n');

  const isStringInit = Object.entries(parsed)
  .map(([key, value]) => formatString(key, value))
  .join('\n');

  const fieldsName = Object.entries(parsed)
  .map(([key,value]) => {
    return stringToFields(key, 1)[0];})
  .join(', ');



  const name = limitConcStr(baseName, companyId);
  const programName = `${name}.aleo`;
  const structName = capitalizeFirstLetter(baseName);

  const leoCode = `program ${programName}{

struct Float{
value:i128,
precision:u32,
}

struct is_Float {
${isFloatFields}
}

struct is_String {
${isStringFields}
}

struct ${structName} {
${structFields}
}

record Information {
    owner : address,
    info : ${structName},
    is_float : is_Float,
    is_string: is_String,
    fieldsName : [field, 32u8],
}

transition emit_info(private receiver: address) -> Information { 
    let information : ${structName} = ${structName} { 
        ${structInit}
    }
    let is_float : is_Float = is_Float {
        ${isFloatInit}
    }
    
    let is_string : is_String = is_String {
        ${isStringInit}
    }
    
    let res : Information = Information {
        owner : receiver,
        info : information,
        is_float : is_float,
        is_string : is_string,
        fieldsName : [${fieldsName}],
    }
    
    return res;
    

}

}

`;

const programDir = path.join('./aleo_Programs', programName);
const outputPath = path.join(programDir, 'main.leo');

// Ensure the full program directory exists
fs.mkdirSync(programDir, { recursive: true });

// Write the Leo code to main.leo
fs.writeFileSync(outputPath, leoCode);

  console.log(`✅ Leo program written to: ${outputPath}`);
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
