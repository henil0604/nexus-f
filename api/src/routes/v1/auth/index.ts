import { baseElysia } from "@/base";
import { RegisterRoute } from "./register";
import { LoginRoute } from "./login";

export const AuthRoutes = baseElysia({
  prefix: "/auth",
  detail: {
    tags: ["auth"],
  },
})
  .use(RegisterRoute)
  .use(LoginRoute);
