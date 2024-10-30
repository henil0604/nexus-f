import { baseElysia } from "@/base";
import db from "@/lib/db";
import { CryptoUtils } from "@/utils/crypto";
import { logger } from "@/utils/logger";
import { until } from "@open-draft/until";
import { t } from "elysia";
import { nanoid } from "nanoid";

export const RegisterBodySchema = t.Object({
  username: t.String({
    minLength: 2,
  }),
  // pem
  publicKey: t.String({
    minLength: 1,
    description: "Public Key in PEM format",
  }),
  // base64
  salt: t.String({
    minLength: 1,
    description: "Salt used for PBKDF2 hashing in base64 format",
  }),
  // base64
  encryptedPrivateKey: t.String({
    minLength: 1,
    description: "Encrypted Private Key in base64 format",
  }),
  // base64
  passwordDigest: t.String({
    minLength: 1,
    description: "Password digest in base64 format",
  }),
  // base64
  signature: t.String({
    minLength: 1,
    description: "Signature in base64 format",
  }),
});

export const RegisterSuccessResponseSchema = t.Object({
  error: t.Literal(false),
  message: t.String(),
});
export const RegisterErrorResponseSchema = t.Object({
  error: t.Literal(true),
  message: t.String(),
});

export const RegisterRoute = baseElysia({
  prefix: "/register",
}).post(
  "",
  async (ctx) => {
    const { body, error: sendError } = ctx;

    const id = nanoid();

    // verify signature
    const { data: signatureVerification, error: SignatureVerificationError } =
      await until(async () =>
        CryptoUtils.verifySignature(
          body.publicKey,
          CryptoUtils.base64ToUint8Array(body.passwordDigest),
          CryptoUtils.base64ToUint8Array(body.signature)
        )
      );

    if (SignatureVerificationError) {
      logger.error(SignatureVerificationError);
      return sendError(500, {
        error: true,
        message: "Signature verification error",
      });
    }

    if (!signatureVerification) {
      return sendError(403, {
        error: true,
        message: "Signature verification failed",
      });
    }

    // check for existing user
    const { data: existingUser, error: DatabaseExistingUserFetchError } =
      await until(() =>
        db.user.findUnique({
          where: {
            username: body.username,
          },
        })
      );

    if (DatabaseExistingUserFetchError) {
      logger.error(DatabaseExistingUserFetchError);
      return sendError(500, {
        error: true,
        message: "Database error",
      });
    }

    if (existingUser) {
      return sendError(409, {
        error: true,
        message: "Username already exists",
      });
    }

    // create user
    const { data: createdUser, error: DatabaseCreateUserError } = await until(
      () =>
        db.user.create({
          data: {
            id,
            username: body.username,
            publicKey: body.publicKey,
            encryptedPrivateKey: body.encryptedPrivateKey,
            salt: body.salt,
            passwordDigest: body.passwordDigest,
          },
        })
    );

    if (DatabaseCreateUserError) {
      logger.error(DatabaseCreateUserError);
      return sendError(500, {
        error: true,
        message: "Database error",
      });
    }

    console.assert(createdUser.id === id, "id mismatch");

    return {
      error: false,
      message: "User registered successfully",
    };
  },
  {
    body: RegisterBodySchema,
    response: {
      200: RegisterSuccessResponseSchema,
      500: RegisterErrorResponseSchema,
      409: RegisterErrorResponseSchema,
      403: RegisterErrorResponseSchema,
    },
    detail: {
      description: "Register a new user",
    },
  }
);
