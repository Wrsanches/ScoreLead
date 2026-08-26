import { describe, expect, test } from "bun:test";
import sharp from "sharp";
import {
  buildSlidePrompt,
  compositeExactAsset,
  selectCreativeDirection,
  selectExactAssetLayout,
} from "./content-image-generator";

describe("content image creative direction", () => {
  test("distributes new posts across several visual styles", () => {
    const ids = new Set(
      Array.from({ length: 30 }, (_, index) =>
        selectCreativeDirection(`post-${index}:caption-${index}`).id,
      ),
    );

    expect(ids.size).toBeGreaterThanOrEqual(4);
  });

  test("rotates on regeneration and preserves style on refinement", () => {
    const current = selectCreativeDirection("post-1");
    const previousPrompt = `== CREATIVE DIRECTION: ${current.id} ==`;
    const regenerated = selectCreativeDirection(
      "post-1",
      previousPrompt,
      false,
    );
    const refined = selectCreativeDirection("post-1", previousPrompt, true);

    expect(regenerated.id).not.toBe(current.id);
    expect(refined.id).toBe(current.id);
  });

  test("writes the selected medium into the generation prompt", () => {
    const direction = selectCreativeDirection("bingo-business");
    const prompt = buildSlidePrompt(
      {
        name: "Friday Bingo",
        description: "Printable bingo cards for family game nights",
        category: "Games",
        field: null,
        persona: "Playful and welcoming",
        clientPersona: "Families and party hosts",
        services: "Printable themed bingo cards",
        brandStyle: null,
        brandColorPrimary: "#ffcc00",
        brandColorSecondary: "#201a40",
        brandFonts: ["Inter"],
        language: "en",
        productImages: null,
      },
      {
        id: "post-bingo",
        postType: "single",
        pillar: "showcase",
        caption: "Your Friday card is ready",
        visualIdea: "Show the bingo card in use",
        callToAction: null,
        referenceImagePref: null,
      },
      { headline: "Your Friday card is ready", role: "cover" },
      0,
      1,
      direction,
    );

    expect(prompt).toContain(`== CREATIVE DIRECTION: ${direction.id} ==`);
    expect(prompt).toContain(direction.medium);
    expect(prompt).toContain("senior Instagram creative director");
    expect(prompt).toContain("Families and party hosts");
    expect(prompt).toContain("under 1.5 seconds");
    expect(prompt).toContain("7% safe margin");
    expect(prompt).not.toContain("THE OUTPUT MUST BE PHOTOREALISTIC");
  });

  test("varies the reserved exact-asset stage with the art direction", () => {
    const layouts = new Set(
      [
        "studio-sculptural",
        "documentary-editorial",
        "tactile-collage",
        "graphic-poster",
        "cinematic-narrative",
        "playful-practical-set",
      ].map((id) => selectExactAssetLayout(id).id),
    );

    expect(layouts.size).toBe(6);
  });

  test("composites the original artwork instead of asking AI to redraw it", async () => {
    const background = await sharp({
      create: {
        width: 200,
        height: 250,
        channels: 4,
        background: { r: 30, g: 30, b: 30, alpha: 1 },
      },
    })
      .png()
      .toBuffer();
    const artwork = await sharp(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="20" height="40" fill="#ff0000"/><rect x="20" width="20" height="40" fill="#0000ff"/></svg>',
      ),
    )
      .png()
      .toBuffer();

    const result = await compositeExactAsset(
      background,
      artwork,
      selectExactAssetLayout("studio-sculptural"),
    );
    const raw = await sharp(result).raw().toBuffer({ resolveWithObject: true });
    const pixel = (x: number, y: number) => {
      const offset = (y * raw.info.width + x) * raw.info.channels;
      return {
        r: raw.data[offset],
        g: raw.data[offset + 1],
        b: raw.data[offset + 2],
      };
    };

    expect(raw.info.width).toBe(200);
    expect(raw.info.height).toBe(250);
    expect(pixel(65, 140).r).toBeGreaterThan(240);
    expect(pixel(65, 140).b).toBeLessThan(15);
    expect(pixel(135, 140).b).toBeGreaterThan(240);
    expect(pixel(135, 140).r).toBeLessThan(15);
  });
});
