import type { NextConfig } from "next";

// BASE_PATH é definido no deploy do GitHub Pages (ex.: "/sac").
// Em desenvolvimento local fica vazio.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
