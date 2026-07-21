
// Cyber Report's own encryption key
const SECRET_PASSPHRASE = "cyber-report-secure-vault-2026";

// Legacy PPPro key – used by Photo Printer Pro; we must support it for .pppro files
const PPPRO_PASSPHRASE = "photo-printer-pro-secure-vault-2024";

const MAGIC_HEADER = "PPPRO";

/**
 * Derives a cryptographic key from the given passphrase.
 */
async function getEncryptionKey(passphrase: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
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
 * Encrypts a project JSON string into an encrypted Base64 payload.
 * On-disk format:
 *   Base64( "PPPRO" | IV[12 bytes] | AES-GCM ciphertext )
 */
export async function encryptProjectData(data: string): Promise<string> {
  if (!data || typeof data !== 'string') {
    return data;
  }

  try {
    const encoder = new TextEncoder();
    const key = await getEncryptionKey(SECRET_PASSPHRASE);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encodedData = encoder.encode(data);
    const ciphertextBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      encodedData
    );

    const headerBytes = encoder.encode(MAGIC_HEADER);
    const ciphertext = new Uint8Array(ciphertextBuffer);

    const combined = new Uint8Array(headerBytes.length + iv.length + ciphertext.length);
    combined.set(headerBytes, 0);
    combined.set(iv, headerBytes.length);
    combined.set(ciphertext, headerBytes.length + iv.length);

    // Convert combined Uint8Array to base64 string in chunks to handle large payloads safely
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < combined.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, combined.length);
      for (let j = i; j < end; j++) {
        binary += String.fromCharCode(combined[j]);
      }
    }

    return btoa(binary);
  } catch (err) {
    console.error("Encryption failed:", err);
    throw new Error("Failed to encrypt project data.");
  }
}

/**
 * Attempts to decrypt the given bytes with a specific passphrase.
 * Returns null if decryption fails (wrong key or corrupt data).
 */
async function tryDecrypt(bytes: Uint8Array, headerLength: number, passphrase: string): Promise<string | null> {
  try {
    const key = await getEncryptionKey(passphrase);
    const iv = bytes.slice(headerLength, headerLength + 12);
    const ciphertext = bytes.slice(headerLength + 12);

    if (iv.length !== 12 || ciphertext.length === 0) return null;

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext
    );

    const result = new TextDecoder().decode(decrypted);
    if (!result || result.trim().length === 0) return null;
    return result;
  } catch {
    return null;
  }
}

/**
 * Decrypts a project file back into a JSON string.
 *
 * Supports three formats:
 *  1. Raw JSON (plain .cyr / new .ppfree files)
 *  2. Encrypted with Cyber Report's own key ("cyber-report-secure-vault-2026")
 *  3. Encrypted with the legacy PPPro key ("photo-printer-pro-secure-vault-2024")
 *
 * For encrypted files (#2 & #3) the on-disk format is:
 *   Base64( "PPPRO" | IV[12 bytes] | AES-GCM ciphertext )
 */
export async function decryptProjectData(encryptedBase64: string): Promise<string> {
  try {
    // Validate input
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
      throw new Error("Invalid project data: empty or not a string");
    }

    const trimmed = encryptedBase64.trim();

    // If it starts with '{' it is already raw JSON — return as-is
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

    // If it doesn't start with the magic header, it's not encrypted — return as-is
    if (!binary.startsWith(MAGIC_HEADER)) {
      return trimmed;
    }

    const bytes = new Uint8Array(binary.length);
    const chunkSize = 8192; // 8 KB chunks
    for (let i = 0; i < binary.length; i += chunkSize) {
      const end = Math.min(i + chunkSize, binary.length);
      for (let j = i; j < end; j++) {
        bytes[j] = binary.charCodeAt(j);
      }
    }

    const headerLength = new TextEncoder().encode(MAGIC_HEADER).length;

    // --- Try Cyber Report key first ---
    const resultCR = await tryDecrypt(bytes, headerLength, SECRET_PASSPHRASE);
    if (resultCR !== null) {
      return resultCR;
    }

    // --- Fall back to legacy PPPro key (for .pppro files encrypted by Photo Printer Pro) ---
    const resultPP = await tryDecrypt(bytes, headerLength, PPPRO_PASSPHRASE);
    if (resultPP !== null) {
      return resultPP;
    }

    throw new Error("Decryption failed with all known keys.");
  } catch (err) {
    console.error("Project load failed:", err);
    // Last-chance fallback: if the original input is plain JSON, return it
    if (encryptedBase64 && encryptedBase64.trim().startsWith('{')) {
      return encryptedBase64;
    }
    throw new Error("Failed to load project: file is corrupted or in an invalid format.");
  }
}
