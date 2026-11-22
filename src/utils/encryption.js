import forge from "node-forge";

// Fallback public key in case network is down during initial handshake
export const DEFAULT_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAh54+vJUV9HHud4gr1rvZ
u54jCCYGlbef/Ogq/keDaEqv1RpDo1Fwgk6tCEgGzY5d1EXU0SmR5n5LCmn31uFx
PbbtrsPcOUOcfQdz7acYafNsLCSBu4bLWlEeBrsGZZOrZ3pMi5sg/31Gb+xVYSK1
V5u8qP0wgtt/QwOqaaOMBpOsQbwZ35COPsHOZBfOVs0VhoZ6O9MtfTR+45ORkD6S
LJabH2nhuQMQBOwlB3da8JMG7TejNJWB46/xC4lm9MdiPtgd6lFquNsYHdBIXkQC
Hva3yc/7Dy26LIpKjn52cSSgpv0QN0Qqjo+6cmxbUL6D8ni1uDz3uCdImjr+eATi
WQIDAQAB
-----END PUBLIC KEY-----`;

let cachedPublicKey = DEFAULT_PUBLIC_KEY;

export async function getEncryptionKey() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/public-key`);
    if (res.ok) {
      const data = await res.json();
      if (data?.data?.publicKey) {
        cachedPublicKey = data.data.publicKey;
      }
    }
  } catch {
    // Use cached/default public key
  }
  return cachedPublicKey;
}

/**
 * Encrypts a sensitive string (such as a password) using RSA-OAEP 2048 with SHA-256.
 * Returns a Base64-encoded ciphertext.
 */
export async function encryptSensitiveData(plainText) {
  if (!plainText) return plainText;

  const keyPem = await getEncryptionKey();
  try {
    const publicKey = forge.pki.publicKeyFromPem(keyPem);
    const encrypted = publicKey.encrypt(plainText, "RSA-OAEP", {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create(),
      },
    });
    return forge.util.encode64(encrypted);
  } catch (err) {
    console.error("Encryption error, sending fallback:", err);
    return plainText;
  }
}
