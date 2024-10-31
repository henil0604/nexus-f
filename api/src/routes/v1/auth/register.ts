import { baseElysia } from "@/base";
import db from "@/lib/db";
import {
  ConstructSuccessResponseSchemaWithData,
  GeneralErrorResponseSchema,
  GeneralSuccessResponseSchema,
  RateLimitErrorResponse,
} from "@/types/response";
import {
  EncryptedPrivateKeySchema,
  PasswordDigestSchema,
  PublicKeySchema,
  SaltSchema,
  UsernameSchema,
} from "@/types/schema";
import { CryptoUtils } from "@/utils/crypto";
import { logger } from "@/utils/logger";
import { until } from "@open-draft/until";
import { t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import moment from "moment";
import { nanoid } from "nanoid";

export const RegisterBodySchema = t.Object({
  username: UsernameSchema,
  // pem
  publicKey: PublicKeySchema,
  // base64
  salt: SaltSchema,
  // base64
  encryptedPrivateKey: EncryptedPrivateKeySchema,
  // base64
  passwordDigest: PasswordDigestSchema,
  // base64
  signature: t.String({
    minLength: 1,
    description: "Signature in base64 format",
  }),
});

export const RegisterRoute = baseElysia({
  prefix: "/register",
})
  .use(
    rateLimit({
      duration: moment.duration(10, "minute").asMilliseconds(),
      max: 5,
      errorResponse: RateLimitErrorResponse,
    })
  )
  .post(
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
        logger.fatal(DatabaseExistingUserFetchError);
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
        logger.fatal(DatabaseCreateUserError);
        return sendError(500, {
          error: true,
          message: "Database error",
        });
      }

      console.assert(createdUser.id === id, "id mismatch");

      // create signature
      const encryptedId = CryptoUtils.uint8ArrayToBase64(
        CryptoUtils.encryptUsingPublicKey(
          body.publicKey,
          CryptoUtils.stringToUint8Array(id)
        )
      );

      return {
        error: false,
        message: "User registered successfully",
        data: {
          encryptedId,
        },
      };
    },
    {
      body: RegisterBodySchema,
      response: {
        200: ConstructSuccessResponseSchemaWithData(
          t.Object({
            encryptedId: t.String({
              minLength: 1,
              description:
                "Encrypted ID with client's public key in base64 format. This can also be used for verification purposes by client.",
            }),
          })
        ),
        500: GeneralErrorResponseSchema,
        409: GeneralErrorResponseSchema,
        403: GeneralErrorResponseSchema,
      },
      detail: {
        description: "Register a new user",
      },
    }
  );
