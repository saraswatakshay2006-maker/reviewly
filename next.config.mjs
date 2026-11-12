/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  images: { unoptimized: true },
  async headers() {
    const noStoreHeaders = [
      {
        key: "Cache-Control",
        value: "private, no-store, no-cache, must-revalidate, max-age=0",
      },
      {
        key: "CDN-Cache-Control",
        value: "no-store",
      },
      {
        key: "Cloudflare-CDN-Cache-Control",
        value: "no-store",
      },
      {
        key: "Pragma",
        value: "no-cache",
      },
      {
        key: "Expires",
        value: "0",
      },
    ];
    return [
      { source: "/r/:path*", headers: noStoreHeaders },
      { source: "/review/:path*", headers: noStoreHeaders },
      { source: "/t/:path*", headers: noStoreHeaders },
      { source: "/app/:path*", headers: noStoreHeaders },
      { source: "/admin/:path*", headers: noStoreHeaders },
      { source: "/api/:path*", headers: noStoreHeaders },
    ];
  },
};

export default nextConfig;
