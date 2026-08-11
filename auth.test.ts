import { betterAuth } from "better-auth";
import { testUtils } from "better-auth/plugins";

import { betterAuthDefaultConfig } from "@/server/better-auth/config";

const plugins = [...betterAuthDefaultConfig.plugins, testUtils()];
const betterAuthDbConfig = { ...betterAuthDefaultConfig, plugins };

export const auth = betterAuth(betterAuthDbConfig);
