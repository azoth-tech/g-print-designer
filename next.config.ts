import type { NextConfig } from "next";
import webpack from 'webpack';

const nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  // Custom webpack config to handle async_hooks issue
  webpack: (config, { isServer, dev }) => {
    // For edge runtime bundles (API routes), replace async_hooks with a stub
    config.plugins = config.plugins || [];

    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /node:async_hooks|async_hooks/,
        (resource) => {
          // Replace with a stub that provides AsyncLocalStorage
          resource.request = false;
        }
      )
    );

    return config;
  },
};

export default nextConfig;
