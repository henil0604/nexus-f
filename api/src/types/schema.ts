import { t } from "elysia";

export const UsernameSchema = t.String({
  minLength: 2,
});

export const PublicKeySchema = t.String({
  minLength: 1,
  description: "Public Key in PEM format",
});

export const SaltSchema = t.String({
  minLength: 1,
  description: "Salt used for PBKDF2 hashing in base64 format",
});

export const EncryptedPrivateKeySchema = t.String({
  minLength: 1,
  description: "Encrypted Private Key in base64 format",
});

export const PasswordDigestSchema = t.String({
  minLength: 1,
  description:
    "Password digest of Encryption Key derived from PBKDF2 Hashing in base64 format",
});
