import type { NextConfig } from "next";

import "./src/env.js";

const config: NextConfig = {
	experimental: {
		useTypeScriptCli: true
	}
};

export default config;
