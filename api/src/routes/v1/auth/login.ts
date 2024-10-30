import { baseElysia } from "@/base";
import db from "@/lib/db";
import {
  GeneralErrorResponseSchema,
  GeneralSuccessResponseSchema,
} from "@/types/response";
import { logger } from "@/utils/logger";
import { until } from "@open-draft/until";
import { t } from "elysia";
import moment from "moment";

export const LoginBodySchema = t.Object({
  username: t.String({
    minLength: 2,
  }),
  passwordDigest: t.String({
    minLength: 1,
  }),
});

export const LoginRoute = baseElysia({
  prefix: "/login",
}).post(
  "",
  async (ctx) => {
    const { body, error: sendError, cookie } = ctx;

    const { data: user, error: DatabaseUserFetchError } = await until(() =>
      db.user.findUnique({
        where: {
          username: body.username,
          passwordDigest: body.passwordDigest,
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

    // create session
    const { data: session, error: DatabaseSessionCreateError } = await until(
      () =>
        db.session.create({
          data: {
            user: {
              connect: {
                username: body.username,
              },
            },
            expiresAt: moment().add(30, "days").toDate(),
          },
        })
    );

    if (DatabaseSessionCreateError) {
      logger.fatal(DatabaseSessionCreateError);
      return sendError(500, {
        error: true,
        message: "Database error",
      });
    }

    if (!session) {
      return sendError(500, {
        error: true,
        message: "Session creation failed",
      });
    }

    console.log(cookie.auth_session.value);
    // if user is already logged in
    if (typeof cookie.auth_session.value === "string") {
      // invalidate old session
      const { error: DatabaseOldSessionDeleteError } = await until(() =>
        db.session.delete({
          where: {
            id: cookie.auth_session.value,
          },
        })
      );

      if (DatabaseOldSessionDeleteError) {
        logger.fatal(DatabaseOldSessionDeleteError);
      }
    }

    cookie.auth_session.value = session.id;

    return {
      error: false,
      message: "User logged in successfully",
    };
  },
  {
    body: LoginBodySchema,
    response: {
      200: GeneralSuccessResponseSchema,
      500: GeneralErrorResponseSchema,
      404: GeneralErrorResponseSchema,
    },
  }
);
