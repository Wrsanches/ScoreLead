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
  async redirects() {
    // Thin marketing pages retired in 2026-09. Keep their URLs resolving so
    // indexed links and backlinks land on the closest surviving page.
    const retired = [
      ["use-cases/b2b-sales-teams", "features/ai-lead-discovery"],
      ["use-cases/b2b-startups", "features/ai-lead-discovery"],
      ["use-cases/b2b-companies", "features/ai-lead-discovery"],
      ["compare/manual-lead-research", "blog/manual-lead-research-vs-automation"],
      ["compare/spreadsheets", "compare/sales-prospecting-software"],
      ["compare/purchased-lead-lists", "features/ai-lead-discovery"],
      ["editorial-policy", "about"],
      ["authors/scorelead-editorial", "about"],
    ];
    return retired.flatMap(([from, to]) => [
      { source: `/${from}`, destination: `/${to}`, permanent: true },
      {
        source: `/:locale(pt|es)/${from}`,
        destination: `/:locale/${to}`,
        permanent: true,
      },
    ]);
  },
  async headers() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "app\\.scorelead\\.io" }],
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
        ],
      },
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
