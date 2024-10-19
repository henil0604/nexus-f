import { baseElysia } from "@/base";

export const V1Routes = baseElysia().get("/", () => "Hello from V1");
