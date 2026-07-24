import { describe, expect, it } from "bun:test";
import { existsSync } from "node:fs";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { blogPosts } from "@/lib/blog";
import {
  getMarketingPlatformImage,
  getMarketingPlatformImageCopy,
  getMarketingPageByPath,
  marketingPages,
} from "@/lib/marketing";
import { getLanguageAlternates, siteConfig, supportedLocales } from "@/lib/seo";

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
        expect(translation.sections.length).toBeGreaterThanOrEqual(3);
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
      expect(
        Object.values(post.fieldNotes).every((note) => note.length > 100),
      ).toBe(true);
    }
  });

  it("uses truthful publication dates and current source URLs", () => {
    expect(new Set(blogPosts.map((post) => post.publishedAt))).toEqual(
      new Set(["2026-07-23"]),
    );
    expect(blogPosts.every((post) => post.updatedAt === "2026-07-24")).toBe(
      true,
    );
    expect(
      blogPosts
        .flatMap((post) => post.sources)
        .some((source) =>
          source.url.includes("/sales/lead-generation/lead-scoring/"),
        ),
    ).toBe(false);
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

  it("separates search, user-requested, and training crawler policies", () => {
    const rules = robots().rules;
    expect(Array.isArray(rules)).toBe(true);
    if (!Array.isArray(rules)) return;

    const agents = rules.map((rule) =>
      Array.isArray(rule.userAgent) ? rule.userAgent : [rule.userAgent],
    );
    const searchAgents = agents.find((group) =>
      group.includes("OAI-SearchBot"),
    );
    const userAgents = agents.find((group) => group.includes("ChatGPT-User"));
    const trainingAgents = agents.find((group) => group.includes("GPTBot"));

    expect(searchAgents).toContain("Claude-SearchBot");
    expect(searchAgents).toContain("PerplexityBot");
    expect(searchAgents).not.toContain("GPTBot");
    expect(userAgents).toContain("Claude-User");
    expect(userAgents).toContain("Perplexity-User");
    expect(trainingAgents).toContain("ClaudeBot");
    expect(trainingAgents).toContain("Applebot-Extended");
    expect(agents.flat()).not.toContain("Claude-Web");
  });

  it("publishes the verified ScoreLead entity profile", () => {
    expect(siteConfig.sameAs).toContain("https://x.com/scorelead_");
    expect(siteConfig.sameAs).toContain(
      "https://www.instagram.com/scorelead.io/",
    );
  });
});
