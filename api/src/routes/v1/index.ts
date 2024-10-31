import { baseElysia } from "@/base";
import { AuthRoutes } from "@/routes/v1/auth";
import { UserRoutes } from "./user";

export const V1Routes = baseElysia({
  prefix: "/v1",
  name: "V1Routes",
})
  .use(AuthRoutes)
  .use(UserRoutes);
