/** @type {import('next').NextConfig} */
const nextConfig = {
  // Do not fail `next build` on ESLint issues (Render / CI).
  // Rules are still available via `npm run lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optional: same for type errors if the build still blocks on types
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
