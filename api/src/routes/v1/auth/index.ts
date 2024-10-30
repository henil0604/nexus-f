import { baseElysia } from "@/base";
import { RegisterRoute } from "./register";

export const AuthRoutes = baseElysia({
  prefix: "/auth",
}).use(RegisterRoute);
