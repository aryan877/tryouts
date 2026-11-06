import type { NextConfig } from "next";

const config: NextConfig = {
  agentRules: false,
  transpilePackages: ["@tryouts/kit", "@tryouts/referee"],
  outputFileTracingIncludes: { "/**": ["./records/*.json"] },
};

export default config;
