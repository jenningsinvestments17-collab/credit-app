const { validateRuntimeEnv } = require("./config/env.runtime.cjs");

validateRuntimeEnv();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
