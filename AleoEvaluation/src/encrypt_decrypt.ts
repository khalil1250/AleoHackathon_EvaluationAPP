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
 * Chiffre une chaîne avec AES-GCM
 * @param data 
 * @param key 
 * @returns Promise<string> base64 avec IV préfixé
 */
export async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  const encryptedArray = new Uint8Array(encrypted);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv);
  combined.set(encryptedArray, iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Déchiffre une chaîne base64 avec IV préfixé
 * @param encryptedData 
 * @param key 
 * @returns Promise<string>
 */
export async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return decoder.decode(decrypted);
}
