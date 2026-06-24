import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root: D:\apps holds many sibling projects with no
  // lockfile, which makes Turbopack pick the wrong root for module resolution.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
