/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import path from "node:path";

/** @type {import("next").NextConfig} */
const config = {
	webpack: (webpackConfig) => {
		webpackConfig.resolve.alias["@"] = path.resolve(process.cwd(), "src");
		return webpackConfig;
	}
};

export default config;
