import type { NextConfig } from "next";

const appEnv = process.env.APP_ENV || process.env.NEXT_PUBLIC_APP_ENV || process.env.NODE_ENV || 'unknown';
const safeLog = {
  APP_ENV: appEnv,
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
};
// Log only safe, non-secret values at config load time
console.log('[next.config] Environment summary:', safeLog);

const nextConfig: NextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  
  // Optimize for production
  compress: true,
  
  // Silence Turbopack root inference warning in monorepo/workspace setups
  turbopack: {
    root: __dirname,
  },
  
  // Place config customizations here as needed
};

export default nextConfig;
