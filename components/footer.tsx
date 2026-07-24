"use client"

import { useTranslations } from "next-intl"
import { Link } from "@/i18n/routing"
import { ScoreLeadLogo } from "./scorelead-logo"

export function Footer() {
  const t = useTranslations("footer")
  const contactLabel = t("contactUs")
  const blogLabel = t("blog")

  const footerLinks = {
    [t("product")]: [t("features"), t("pricing"), t("changelog"), t("integrations"), t("security")],
    [t("resources")]: [t("documentation"), t("apiReference"), t("guides"), t("status")],
    [t("company")]: [t("about"), t("blog"), t("careers"), t("customers")],
    [t("legal")]: [t("privacy"), t("terms"), t("dpa"), t("security")],
    [t("connect")]: [t("contactUs"), t("twitter"), t("github")],
  }

  return (
    <footer className="border-t border-zinc-800 py-16 px-6" style={{ backgroundColor: "#09090B" }}>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <ScoreLeadLogo className="w-5 h-5 text-white" />
              <span className="text-white font-semibold text-sm">ScoreLead</span>
            </div>
            <a
              href="mailto:hello@scorelead.io"
              className="mt-4 inline-block text-sm text-zinc-500 transition-colors hover:text-zinc-300"
            >
              hello@scorelead.io
            </a>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-white font-medium text-sm mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    {link === contactLabel || link === blogLabel ? (
                      <Link
                        href={link === blogLabel ? "/blog" : "/contact"}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm"
                      >
                        {link}
                      </Link>
                    ) : (
                      <span className="text-zinc-500 hover:text-zinc-300 transition-colors text-sm cursor-default">
                        {link}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
