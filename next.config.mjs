/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "sfozpnhknzamtdqmmjtl.supabase.co",
      },
      {
        hostname: "mynvsgmvogwjsrrm.public.blob.vercel-storage.com",
      },
      {
        hostname: "localhost",
      },
    ],
  },
};

export default nextConfig;
