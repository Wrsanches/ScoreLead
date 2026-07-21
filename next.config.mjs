import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Allow next/image to optimize images served from our S3 bucket / CDN.
const imageRemotePatterns = [];
if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
  imageRemotePatterns.push({
    protocol: "https",
    hostname: `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`,
  });
}
if (process.env.AWS_S3_PUBLIC_BASE_URL) {
  try {
    imageRemotePatterns.push({
      protocol: "https",
      hostname: new URL(process.env.AWS_S3_PUBLIC_BASE_URL).hostname,
    });
  } catch {
    // ignore malformed AWS_S3_PUBLIC_BASE_URL
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only externalize the server-only packages that break Turbopack's ESM
  // bundling. Do NOT externalize `better-auth` / `@better-auth/stripe` - their
  // React client subpaths (better-auth/react) must stay bundled, or client
  // components resolve a null React at SSR ("Cannot read properties of null
  // (reading 'useRef')"). The kysely adapter is the piece that actually fails
  // to bundle; externalizing it stops Turbopack from analyzing its internals.
  serverExternalPackages: ["@better-auth/kysely-adapter", "kysely", "stripe"],
  images: {
    remotePatterns: imageRemotePatterns,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
