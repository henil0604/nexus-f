import { baseElysia } from "@/base";
import { SaltRoute } from "./salt";
import { PublicKeyRoute } from "./publicKey";

export const UserRoutes = baseElysia({
  prefix: "/user",
  name: "UserRoutes",
  detail: {
    tags: ["user"],
  },
})
  .use(SaltRoute)
  .use(PublicKeyRoute);
