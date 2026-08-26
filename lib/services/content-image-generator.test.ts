import { describe, expect, test } from "bun:test";
import {
  buildSlidePrompt,
  selectCreativeDirection,
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

});
