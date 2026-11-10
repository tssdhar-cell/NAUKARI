import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Every page reads live data for a single logged-in user, so we render
  // dynamically and skip Cache Components / Partial Prefetching.
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
