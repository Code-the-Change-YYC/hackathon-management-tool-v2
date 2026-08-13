import type { NextConfig } from "next";

import "./src/env.js";

const config: NextConfig = {
	experimental: {
		useTypeScriptCli: true
	},
	allowedDevOrigins: ["http://localhost:3000", "127.0.0.1"]
};

export default config;
