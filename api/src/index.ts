import { Elysia } from "elysia";
import { logger } from "./utils/logger";

const app = new Elysia().get("/", () => "Hello Elysia");

const PORT = Bun.env.PORT;

if (!PORT) {
  logger.fatal("PORT is not defined, throwing error");
  throw new Error("PORT is not defined");
}

app.listen(PORT, () => {
  logger.success("Server started on port", PORT);
});
