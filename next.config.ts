import type { NextConfig } from "next";

import "./src/env.js";

const config: NextConfig = {
	experimental: {
		useTypeScriptCli: true
	},
	allowedDevOrigins: ["http://localhost:3000", "127.0.0.1", "http://127.0.0.1"],
	images: {
		remotePatterns: [
			{
				hostname: "images.ctfassets.net",
				protocol: "https"
			},
			{
				hostname: "downloads.ctfassets.net",
				protocol: "https"
			}
		]
	}
};

export default config;
