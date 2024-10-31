import { baseElysia } from "@/base";
import db from "@/lib/db";
import {
  ConstructSuccessResponseSchemaWithData,
  GeneralErrorResponseSchema,
} from "@/types/response";
import { SaltSchema, UsernameSchema } from "@/types/schema";
import { logger } from "@/utils/logger";
import { until } from "@open-draft/until";
import { t } from "elysia";

export const SaltRoute = baseElysia({
  prefix: "/:username/salt",
  name: "UserSaltRoute",
}).get(
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
          salt: true,
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
        salt: user.salt,
      },
    };
  },
  {
    response: {
      200: ConstructSuccessResponseSchemaWithData(
        t.Object({
          salt: SaltSchema,
        })
      ),
      404: GeneralErrorResponseSchema,
      500: GeneralErrorResponseSchema,
    },
    detail: {
      description: "Returns the salt for a given username",
    },
  }
);
