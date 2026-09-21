import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ConsentGatedAnalytics } from '@/components/analytics'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import { hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { getLocaleConfig, siteConfig, siteViewport } from '@/lib/seo'
import { CookieConsent } from '@/components/cookie-consent'
import NextTopLoader from 'nextjs-toploader'
import '../globals.css'

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  applicationName: siteConfig.name,
  // Child routes set a bare title segment (e.g. "Log in"); this appends the
  // brand. The landing page overrides with its own full SEO title.
  title: {
    template: `%s | ${siteConfig.name}`,
    default: siteConfig.name,
  },
}

export const viewport = siteViewport

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={getLocaleConfig(locale).htmlLang}
      data-scroll-behavior="smooth"
      className={`dark ${geist.variable} ${geistMono.variable}`}
      style={{ backgroundColor: "#09090b", colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-[#09090B]">
        <NextTopLoader
          color="linear-gradient(90deg, #059669 0%, #34d399 60%, #a7f3d0 100%)"
          height={2}
          showSpinner={false}
          shadow="0 0 14px rgba(52, 211, 153, 0.45)"
          zIndex={2000}
          showForHashAnchor={false}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-white focus:text-zinc-900 focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        {/* The app is dark-only: the class is set statically on <html> above.
            (next-themes used to do this with an inline <script>, which React 19
            warns about on every client-side mount of this layout.) */}
        <NextIntlClientProvider messages={messages}>
          {children}
          <CookieConsent />
        </NextIntlClientProvider>
        <ConsentGatedAnalytics
          publicGaId={
            process.env.NEXT_PUBLIC_GA_PUBLIC_ID ||
            process.env.NEXT_PUBLIC_GA_ID
          }
          appGaId={process.env.NEXT_PUBLIC_GA_APP_ID}
        />
      </body>
    </html>
  )
}
