import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['*.ngrok-free.app', '*.ngrok.io'],
  transpilePackages: ['@salkaro/ui'],
};

export default nextConfig;
