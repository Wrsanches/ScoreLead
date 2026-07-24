import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import sitemap from "@/app/sitemap";
import { blogPosts } from "@/lib/blog";
import {
  getMarketingPlatformImage,
  getMarketingPlatformImageCopy,
  getMarketingPageByPath,
  marketingPages,
} from "@/lib/marketing";
import { getLanguageAlternates, supportedLocales } from "@/lib/seo";

describe("localized SEO content registry", () => {
  it("keeps every commercial page substantive in every supported locale", () => {
    expect(marketingPages).toHaveLength(22);

    for (const page of marketingPages) {
      for (const locale of supportedLocales) {
        const translation = page.translations[locale];
        expect(translation.title.length).toBeGreaterThan(10);
        expect(translation.description.length).toBeGreaterThan(60);
        expect(translation.answer.length).toBeGreaterThan(80);
        expect(translation.highlights).toHaveLength(3);
        expect(translation.sections).toHaveLength(3);
        expect(
          translation.sections.every(
            (section) => section.paragraphs.length > 0,
          ),
        ).toBe(true);
      }
    }
  });

  it("uses unique paths and resolves every article's commercial destination", () => {
    const pathnames = marketingPages.map((page) => page.pathname);
    expect(new Set(pathnames).size).toBe(pathnames.length);

    for (const post of blogPosts) {
      expect(getMarketingPageByPath(post.relatedMarketingPath)).toBeDefined();
      expect(post.sources.length).toBeGreaterThanOrEqual(2);
      expect(
        post.sources.every((source) => source.url.startsWith("https://")),
      ).toBe(true);
    }
  });

  it("publishes reciprocal language alternates for every commercial path", () => {
    for (const page of marketingPages) {
      const alternates = getLanguageAlternates(page.pathname);
      expect(Object.keys(alternates)).toEqual([
        "en",
        "pt-BR",
        "es",
        "x-default",
      ]);
      expect(alternates.en).toContain(page.pathname);
      expect(alternates["pt-BR"]).toContain(`/pt/${page.pathname}`);
      expect(alternates.es).toContain(`/es/${page.pathname}`);
      expect(alternates["x-default"]).toBe(alternates.en);
    }
  });

  it("assigns a real, localized platform image to every commercial page", () => {
    for (const page of marketingPages) {
      const image = getMarketingPlatformImage(page.id);
      expect(image.src).toStartWith("/images/platform/ceramik-");
      expect(existsSync(`${process.cwd()}/public${image.src}`)).toBe(true);

      for (const locale of supportedLocales) {
        const copy = getMarketingPlatformImageCopy(locale, image.variant);
        expect(copy.alt.length).toBeGreaterThan(60);
        expect(copy.caption.length).toBeGreaterThan(60);
      }
    }
  });

  it("includes every localized public URL with stable modification dates", () => {
    const entries = sitemap();
    expect(entries).toHaveLength(114);

    for (const page of marketingPages) {
      const matches = entries.filter((entry) =>
        entry.url.includes(page.pathname),
      );
      expect(matches).toHaveLength(3);
      expect(
        matches.every(
          (entry) =>
            entry.lastModified instanceof Date &&
            entry.lastModified.toISOString().startsWith(page.updatedAt),
        ),
      ).toBe(true);
    }
  });
});
