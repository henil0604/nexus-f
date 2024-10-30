import forge from "node-forge";

type KeyPair = { publicKey: string; privateKey: string };

// Utility functions for encoding/decoding between Uint8Array, forge binary, and Base64
const encode = (data: Uint8Array) => forge.util.binary.raw.encode(data);
const decode = (data: string) =>
  new Uint8Array(forge.util.binary.raw.decode(data));
const toBase64 = (data: Uint8Array) => forge.util.encode64(encode(data));
const fromBase64 = (base64: string) => decode(base64ToUtf8(base64));
const strToUint8 = (str: string) => new TextEncoder().encode(str);
const uint8ToStr = (arr: Uint8Array) => new TextDecoder().decode(arr);
const base64ToUtf8 = (base64: string) => forge.util.decode64(base64);

// Key pair generation
const generateKeyPair = (): KeyPair => {
  const { publicKey, privateKey } = forge.pki.rsa.generateKeyPair(2048);

  return {
    publicKey: forge.pki.publicKeyToPem(publicKey),
    privateKey: forge.pki.privateKeyToPem(privateKey),
  };
};

// RSA encryption/decryption
const encryptUsingPublicKey = (publicKeyPem: string, data: Uint8Array) =>
  decode(
    forge.util.encode64(
      forge.pki
        .publicKeyFromPem(publicKeyPem)
        .encrypt(encode(data), "RSA-OAEP", { md: forge.md.sha256.create() })
    )
  );

const decryptUsingPrivateKey = (privateKeyPem: string, data: Uint8Array) =>
  decode(
    forge.pki
      .privateKeyFromPem(privateKeyPem)
      .decrypt(forge.util.decode64(encode(data)), "RSA-OAEP", {
        md: forge.md.sha256.create(),
      })
  );

// AES encryption/decryption
const generateRandom = (bits: number = 256) =>
  decode(forge.random.getBytesSync(bits / 8));

const encryptUsingAESKey = (key: Uint8Array, data: Uint8Array, ivBits = 16) => {
  const iv = forge.random.getBytesSync(ivBits);
  const cipher = forge.cipher.createCipher("AES-CBC", encode(key));
  cipher.start({ iv });
  cipher.update(forge.util.createBuffer(encode(data)));
  cipher.finish();
  return decode(iv + cipher.output.getBytes());
};

const decryptUsingAESKey = (key: Uint8Array, data: Uint8Array, ivBits = 16) => {
  const rawData = encode(data),
    iv = rawData.slice(0, ivBits),
    encText = rawData.slice(ivBits);
  const decipher = forge.cipher.createDecipher("AES-CBC", encode(key));
  decipher.start({ iv });
  decipher.update(forge.util.createBuffer(encText));
  if (!decipher.finish()) throw new Error("Decryption failed");
  return decode(decipher.output.getBytes());
};

// RSA signing/verification
const sign = (privateKeyPem: string, data: Uint8Array) => {
  const md = forge.md.sha256.create();
  md.update(encode(data));
  return decode(forge.pki.privateKeyFromPem(privateKeyPem).sign(md));
};

const verifySignature = (
  publicKeyPem: string,
  data: Uint8Array,
  signature: Uint8Array
) => {
  const md = forge.md.sha256.create();
  md.update(encode(data));
  return forge.pki
    .publicKeyFromPem(publicKeyPem)
    .verify(md.digest().bytes(), encode(signature));
};

// Hashing
const generateHash = (data: Uint8Array) => {
  const md = forge.md.sha256.create();
  md.update(encode(data));
  return decode(md.digest().bytes());
};

const PBKDF2 = (
  password: string,
  salt: string,
  iterations: number,
  keyLength: number
) => {
  const key = forge.pkcs5.pbkdf2(
    password,
    salt,
    iterations,
    keyLength,
    forge.md.sha256.create()
  );
  return decode(key);
};

export const CryptoUtils = {
  generateKeyPair,
  encryptUsingPublicKey,
  decryptUsingPrivateKey,
  generateRandom,
  encryptUsingAESKey,
  decryptUsingAESKey,
  stringToUint8Array: strToUint8,
  uint8ArrayToString: uint8ToStr,
  uint8ArrayToBase64: toBase64,
  base64ToUint8Array: fromBase64,
  base64ToUtf8: base64ToUtf8,
  sign,
  verifySignature,
  generateHash,
  PBKDF2,
};
