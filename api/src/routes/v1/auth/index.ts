import { baseElysia } from "@/base";
import { RegisterRoute } from "./register";
import { LoginRoute } from "./login";
import { t } from "elysia";
import { logger } from "@/utils/logger";
import db from "@/lib/db";
import { until } from "@open-draft/until";
import {
  ConstructSuccessResponseSchemaWithData,
  GeneralErrorResponseSchema,
} from "@/types/response";

export const AuthRoutes = baseElysia({
  prefix: "/auth",
})
  .use(RegisterRoute)
  .use(LoginRoute)
  .get(
    "/user-salt",
    async (ctx) => {
      const { query, error: sendError } = ctx;

      const { data: user, error: DatabaseSaltFetchError } = await until(() =>
        db.user.findUnique({
          where: {
            username: query.username,
          },
          select: {
            username: true,
            salt: true,
          },
        })
      );

      if (DatabaseSaltFetchError) {
        logger.fatal(DatabaseSaltFetchError);
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

      console.assert(query.username === user.username, "username mismatch");

      return {
        error: false,
        message: "Salt fetched successfully",
        data: {
          salt: user.salt,
        },
      };
    },
    {
      query: t.Object({
        username: t.String(),
      }),
      response: {
        200: ConstructSuccessResponseSchemaWithData(
          t.Object({
            salt: t.String(),
          })
        ),
        404: GeneralErrorResponseSchema,
        500: GeneralErrorResponseSchema,
      },
    }
  );
