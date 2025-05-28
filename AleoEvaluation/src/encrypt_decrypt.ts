const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Dérive une clé de chiffrement à partir du username + hash_password
 * @param username 
 * @param hash_password - hash du mot de passe (ex: sha256)
 * @returns Promise<CryptoKey>
 */
export async function deriveKey(username: string, hash_password: string): Promise<CryptoKey> {
  const salt = encoder.encode(username);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(hash_password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffre une chaîne en utilisant AES-GCM.
 * Le IV est préfixé au résultat chiffré.
 * @param data - texte à chiffrer
 * @param key - CryptoKey AES-GCM
 * @returns base64(string) contenant IV + encrypted
 */
export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96 bits IV recommandé pour AES-GCM
  const encodedData = encoder.encode(data);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedData
  );

  const encryptedBytes = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedBytes.length);

  combined.set(iv); // IV en premier
  combined.set(encryptedBytes, iv.length); // données chiffrées ensuite

  return btoa(String.fromCharCode(...combined));
}

/**
 * Déchiffre une chaîne base64 retournée par `encrypt`.
 * @param encryptedBase64 - chaîne base64 contenant IV + data
 * @param key - CryptoKey AES-GCM
 * @returns chaîne déchiffrée (texte clair)
 */
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));

  const iv = combined.slice(0, 12); // IV: 12 premiers octets
  const encryptedData = combined.slice(12); // reste: données chiffrées

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    encryptedData
  );

  return decoder.decode(decrypted);
}

// encrypt_decrypt.ts
export async function encryptWithViewKey(jsonData: string, viewKey: string): Promise<string> {
  const encoder = new TextEncoder();

  // 1. Derive a symmetric key from the viewKey using SHA-256
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(viewKey),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt"]
  );

  // 2. Chiffrer les données JSON
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // IV pour AES-GCM
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    derivedKey,
    encoder.encode(jsonData)
  );

  // 3. Combine salt + iv + encrypted content into a base64 string
  const combined = new Uint8Array([...salt, ...iv, ...new Uint8Array(encryptedData)]);
  return btoa(String.fromCharCode(...combined));
}

