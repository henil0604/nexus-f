import { baseElysia } from "@/base";
import db from "@/lib/db";
import {
  ConstructSuccessResponseSchemaWithData,
  GeneralErrorResponseSchema,
  RateLimitErrorResponse,
} from "@/types/response";
import { PublicKeySchema } from "@/types/schema";
import { logger } from "@/utils/logger";
import { until } from "@open-draft/until";
import { t } from "elysia";
import { rateLimit } from "elysia-rate-limit";
import moment from "moment";

export const PublicKeyRoute = baseElysia({
  prefix: "/:username/public-key",
  name: "UserPublicKeyRoute",
})
  .use(
    rateLimit({
      duration: moment.duration(1, "minute").asMilliseconds(),
      max: 50,
      errorResponse: RateLimitErrorResponse,
    })
  )
  .get(
    "",
    async (ctx) => {
      const { params, error: sendError } = ctx;

      const { data: user, error: DatabaseUserFetchError } = await until(() =>
        db.user.findUnique({
          where: {
            username: params.username,
          },
          select: {
            username: true,
            publicKey: true,
          },
        })
      );

      if (DatabaseUserFetchError) {
        logger.fatal(DatabaseUserFetchError);
        return sendError(500, {
          error: true,
          message: "Database error",
        });
      }

      if (!user) {
        return sendError(404, {
          error: true,
          message: "User not found",
        });
      }

      console.assert(params.username === user.username, "username mismatch");

      return {
        error: false,
        message: "Salt fetched successfully",
        data: {
          publicKey: user.publicKey,
        },
      };
    },
    {
      response: {
        200: ConstructSuccessResponseSchemaWithData(
          t.Object({
            publicKey: PublicKeySchema,
          })
        ),
        404: GeneralErrorResponseSchema,
        500: GeneralErrorResponseSchema,
      },
    }
  );
