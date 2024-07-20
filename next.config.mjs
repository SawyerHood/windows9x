/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "akebmgwfsdwbcjztntxv.supabase.co",
      },
      {
        hostname: "mynvsgmvogwjsrrm.public.blob.vercel-storage.com",
      },
      {
        hostname: "localhost",
      },
    ],
  },
  transpilePackages: ["file-system-access", "fetch-blob"],
};

export default nextConfig;
