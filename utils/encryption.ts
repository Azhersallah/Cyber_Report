
const SECRET_PASSPHRASE = "photo-printer-pro-secure-vault-2024";
const MAGIC_HEADER = "PPPRO";

/**
 * Derives a cryptographic key from the hardcoded passphrase.
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_PASSPHRASE),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("pppro-salt-v1"),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * NO-OP: Returns the raw JSON data string.
 * We no longer encrypt project files, keeping them as standard human-readable JSON.
 */
export async function encryptProjectData(data: string): Promise<string> {
  return data;
}

/**
 * Decrypts the custom binary format back into a JSON string.
 * Retains backwards compatibility for previously encrypted project files.
 */
export async function decryptProjectData(encryptedBase64: string): Promise<string> {
  try {
    // Validate input
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
      throw new Error("Invalid project data: empty or not a string");
    }

    const trimmed = encryptedBase64.trim();

    // If it starts with '{' it is already raw JSON, return as-is
    if (trimmed.startsWith('{')) {
      return trimmed;
    }

    // Check if it looks like a Base64 string before attempting atob
    const isBase64 = /^[a-zA-Z0-9+/]*={0,2}$/.test(trimmed);
    if (!isBase64) {
      return trimmed;
    }

    // Decode Base64 - handle large files safely
    const binary = atob(trimmed);
    
    // If it doesn't start with the magic header, it's not encrypted, return as-is
    if (!binary.startsWith(MAGIC_HEADER)) {
      return trimmed;
    }

    const bytes = new Uint8Array(binary.length);
    const chunkSize = 8192; // 8KB chunks
    for (let i = 0; i < binary.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, binary.length);
      for (let j = i; j < end; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const headerBytes = encoder.encode(MAGIC_HEADER);

    const iv = bytes.slice(headerBytes.length, headerBytes.length + 12);
    const ciphertext = bytes.slice(headerBytes.length + 12);
    
    // Validate IV and ciphertext
    if (iv.length !== 12) {
      throw new Error("Corrupted IV");
    }
    if (ciphertext.length === 0) {
      throw new Error("No encrypted data");
    }

    const key = await getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const result = decoder.decode(decrypted);
    
    // Validate result is valid JSON
    if (!result || result.trim().length === 0) {
      throw new Error("Decryption resulted in empty data");
    }

    return result;
  } catch (err) {
    console.error("Project load failed:", err);
    // Fallback: if decryption failed but the original input is JSON, return it
    if (encryptedBase64 && encryptedBase64.trim().startsWith('{')) {
      return encryptedBase64;
    }
    throw new Error("Failed to load project: file is corrupted or in an invalid format.");
  }
}
