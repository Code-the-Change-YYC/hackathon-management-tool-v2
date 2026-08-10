import path from "node:path";

import type { NextConfig } from "next";

import "./src/env.js";

const config: NextConfig = {
	webpack: (webpackConfig) => {
		webpackConfig.resolve.alias["@"] = path.resolve(process.cwd(), "src");
		return webpackConfig;
	}
};

export default config;
