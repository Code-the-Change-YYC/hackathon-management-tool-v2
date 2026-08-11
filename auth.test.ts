import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

import { betterAuthConfig } from "@/server/better-auth/config";

const plugins = [...betterAuthConfig.plugins, testUtils()];
const betterAuthDbConfig = { ...betterAuthConfig, plugins };

export const auth = betterAuth(betterAuthDbConfig);
