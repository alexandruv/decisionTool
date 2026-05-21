import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        basePath: "/decisionTool",
        assetPrefix: "/decisionTool/",
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
