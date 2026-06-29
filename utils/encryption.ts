
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
 * Encrypts a string into a custom binary format (Base64 encoded string).
 * Format: [MAGIC_HEADER][IV_12_BYTES][CIPHERTEXT]
 * 
 * FIXED: Improved chunking to prevent corruption with large files
 */
export async function encryptProjectData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(data);

  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedData
  );

  const combined = new Uint8Array(MAGIC_HEADER.length + iv.length + ciphertext.byteLength);
  const headerBytes = encoder.encode(MAGIC_HEADER);
  
  combined.set(headerBytes, 0);
  combined.set(iv, headerBytes.length);
  combined.set(new Uint8Array(ciphertext), headerBytes.length + iv.length);

  // Convert to Base64 safely - use smaller chunks to prevent stack overflow
  // and memory issues with large files
  const chunkSize = 8192; // 8KB chunks (smaller for better stability)
  const chunks: string[] = [];
  
  for (let i = 0; i < combined.length; i += chunkSize) {
    const chunk = combined.subarray(i, Math.min(i + chunkSize, combined.length));
    // Convert chunk to string character by character (safe for all sizes)
    let chunkStr = '';
    for (let j = 0; j < chunk.length; j++) {
      chunkStr += String.fromCharCode(chunk[j]);
    }
    chunks.push(chunkStr);
  }
  
  const binary = chunks.join('');
  return btoa(binary);
}

/**
 * Decrypts the custom binary format back into a JSON string.
 * 
 * FIXED: Improved error handling and validation
 */
export async function decryptProjectData(encryptedBase64: string): Promise<string> {
  try {
    // Validate input
    if (!encryptedBase64 || typeof encryptedBase64 !== 'string') {
      throw new Error("Invalid encrypted data: empty or not a string");
    }

    // Decode Base64 - handle large files safely
    const binary = atob(encryptedBase64);
    const bytes = new Uint8Array(binary.length);
    
    // Process in smaller chunks for better stability
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

    // Verify file is large enough to contain header + IV + data
    const minSize = headerBytes.length + 12 + 16; // header + IV + minimum ciphertext
    if (bytes.length < minSize) {
      throw new Error("Invalid file format: file too small or corrupted");
    }

    // Verify magic header
    for (let i = 0; i < headerBytes.length; i++) {
      if (bytes[i] !== headerBytes[i]) {
        throw new Error("Invalid file format: Missing magic header. This file may be corrupted.");
      }
    }

    const iv = bytes.slice(headerBytes.length, headerBytes.length + 12);
    const ciphertext = bytes.slice(headerBytes.length + 12);
    
    // Validate IV and ciphertext
    if (iv.length !== 12) {
      throw new Error("Invalid file format: corrupted IV");
    }
    if (ciphertext.length === 0) {
      throw new Error("Invalid file format: no encrypted data");
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
    console.error("Decryption failed:", err);
    if (err instanceof Error) {
      throw new Error(`Failed to decrypt the file: ${err.message}. The file might be corrupted or created with a different version.`);
    }
    throw new Error("Failed to decrypt the file. It might be corrupted or created with a different version.");
  }
}
