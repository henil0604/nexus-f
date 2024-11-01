import { swagger } from "@elysiajs/swagger";
import { baseElysia } from "@/base";
import { V1Routes } from "@/routes/v1";
import { logger as NiceLogger } from "@tqman/nice-logger";
import { logger } from "@/utils/logger";

const app = baseElysia({
  precompile: true,
  name: "root",
})
  .use(
    NiceLogger({
      mode: "live",
      withTimestamp: () => {
        return new Date().toISOString();
      },
    })
  )
  .use(
    swagger({
      path: "/swagger",
    })
  )
  .use(V1Routes);

// Start the server
const PORT = Bun.env.PORT;

if (!PORT) {
  logger.fatal("PORT is not defined, throwing error");
  throw new Error("PORT is not defined");
}

app.listen(PORT, () => {
  logger.success("Server started on port", PORT);
});
