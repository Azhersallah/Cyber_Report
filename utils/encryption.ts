
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
    window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent: 10, stage: 'encrypt' } }));
    await new Promise(r => setTimeout(r, 10));

    const encoder = new TextEncoder();
    const key = await getEncryptionKey(SECRET_PASSPHRASE);
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encodedData = encoder.encode(data);

    window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent: 25, stage: 'encrypt' } }));
    await new Promise(r => setTimeout(r, 10));

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

    window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent: 45, stage: 'encode' } }));
    await new Promise(r => setTimeout(r, 10));

    // Convert combined Uint8Array to base64 string in chunks safely without freezing UI
    let binary = '';
    const chunkSize = 16384;
    const totalLength = combined.length;

    for (let i = 0; i < totalLength; i += chunkSize) {
      const end = Math.min(i + chunkSize, totalLength);
      for (let j = i; j < end; j++) {
        binary += String.fromCharCode(combined[j]);
      }

      // Yield every 32 chunks (~512KB) to keep UI responsive and update progress
      if ((i / chunkSize) % 32 === 0) {
        const percent = Math.min(90, 45 + Math.round((i / totalLength) * 45));
        window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent, stage: 'encode' } }));
        await new Promise(r => setTimeout(r, 0));
      }
    }

    window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent: 92, stage: 'write' } }));
    await new Promise(r => setTimeout(r, 0));

    const base64Result = btoa(binary);

    window.dispatchEvent(new CustomEvent('project-save-progress', { detail: { percent: 98, stage: 'write' } }));

    return base64Result;
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
 * Safely decodes a Base64 string into a Uint8Array in async chunks without blocking the main UI thread.
 */
async function base64ToUint8ArrayAsync(base64: string): Promise<Uint8Array> {
  const cleanBase64 = base64.trim();
  const len = cleanBase64.length;

  let padding = 0;
  if (cleanBase64.endsWith('==')) padding = 2;
  else if (cleanBase64.endsWith('=')) padding = 1;
  const totalBytes = Math.max(0, Math.floor((len * 3) / 4) - padding);

  const bytes = new Uint8Array(totalBytes);
  let byteOffset = 0;

  // Process in Base64 chunks (must be multiple of 4)
  const chunkSize = 65536; // 64 KB of base64 text
  for (let i = 0; i < len; i += chunkSize) {
    const end = Math.min(i + chunkSize, len);
    const chunkStr = cleanBase64.slice(i, end);
    const chunkBinary = atob(chunkStr);

    for (let j = 0; j < chunkBinary.length; j++) {
      if (byteOffset < totalBytes) {
        bytes[byteOffset++] = chunkBinary.charCodeAt(j);
      }
    }

    // Yield every 8 chunks (~512KB base64) to keep UI 100% fluid
    const currentChunk = Math.floor(i / chunkSize);
    if (currentChunk % 8 === 0) {
      const percent = Math.min(78, 20 + Math.round((i / len) * 58));
      window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent, stage: 'decrypt' } }));
      await new Promise(r => setTimeout(r, 0));
    }
  }

  return bytes;
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

    window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 10, stage: 'read' } }));
    await new Promise(r => setTimeout(r, 10));

    const trimmed = encryptedBase64.trim();

    // If it starts with '{' it is already raw JSON — return as-is
    if (trimmed.startsWith('{')) {
      window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 85, stage: 'parse' } }));
      await new Promise(r => setTimeout(r, 10));
      return trimmed;
    }

    window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 20, stage: 'decrypt' } }));
    await new Promise(r => setTimeout(r, 10));

    // Decode Base64 in non-blocking async chunks (20% -> 78%)
    const bytes = await base64ToUint8ArrayAsync(trimmed);

    if (bytes.length < 5) {
      return trimmed;
    }

    const headerStr = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3], bytes[4]);
    if (headerStr !== MAGIC_HEADER) {
      return trimmed;
    }

    window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 80, stage: 'decrypt' } }));
    await new Promise(r => setTimeout(r, 10));

    const headerLength = 5;

    // --- Try Cyber Report key first ---
    let resultCR = await tryDecrypt(bytes, headerLength, SECRET_PASSPHRASE);
    if (resultCR !== null) {
      window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 88, stage: 'parse' } }));
      await new Promise(r => setTimeout(r, 10));
      return resultCR;
    }

    // --- Fall back to legacy PPPro key (for .pppro files encrypted by Photo Printer Pro) ---
    let resultPP = await tryDecrypt(bytes, headerLength, PPPRO_PASSPHRASE);
    if (resultPP !== null) {
      window.dispatchEvent(new CustomEvent('project-load-progress', { detail: { percent: 88, stage: 'parse' } }));
      await new Promise(r => setTimeout(r, 10));
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
