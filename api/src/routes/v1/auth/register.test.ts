import { CryptoUtils } from "@/utils/crypto";
import { RegisterRoute } from "./register";

const { publicKey, privateKey } = CryptoUtils.generateKeyPair();

const password = "secret3";
const salt = CryptoUtils.generateRandom();

const encryptionKey = CryptoUtils.PBKDF2(
  password,
  CryptoUtils.uint8ArrayToString(salt),
  10_000,
  128 / 8
);

const encryptedPrivateKey = CryptoUtils.encryptUsingAESKey(
  encryptionKey,
  CryptoUtils.stringToUint8Array(privateKey)
);

const passwordDigest = CryptoUtils.generateHash(encryptionKey);

const signature = CryptoUtils.sign(privateKey, passwordDigest);

const body = {
  username: "charlie",
  publicKey: publicKey,
  encryptedPrivateKey: CryptoUtils.uint8ArrayToBase64(encryptedPrivateKey),
  passwordDigest: CryptoUtils.uint8ArrayToBase64(passwordDigest),
  signature: CryptoUtils.uint8ArrayToBase64(signature),
  salt: CryptoUtils.uint8ArrayToBase64(salt),
};
console.log("client.body?", body);

const request = new Request("http://localhost/register", {
  method: "POST",
  body: JSON.stringify(body),
  headers: {
    "Content-Type": "application/json",
  },
});

const response = await RegisterRoute.handle(request);

const data = await response.json();

console.log("data?", data);

const id = CryptoUtils.decryptUsingPrivateKey(
  privateKey,
  CryptoUtils.base64ToUint8Array(data.data.encryptedId)
);

console.log("id?", CryptoUtils.uint8ArrayToString(id));
