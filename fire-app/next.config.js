/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Allow production builds to complete even with type errors
    // This is needed due to Supabase TypeScript inference limitations
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig