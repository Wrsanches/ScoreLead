import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "/Users/wrsanches/Developer/scorelead";
const outputDir = path.join(root, ".artifacts/product-hunt/clean");
const logoPath = path.join(root, "public/scorelead-logo.svg");
const width = 1270;
const height = 760;

const slides = [
  {
    file: "scorelead-product-hunt-clean-02-discovery.png",
    source: "public/images/platform/ceramik-discovery.webp",
    title: "Discover the right companies",
  },
  {
    file: "scorelead-product-hunt-clean-03-scoring.png",
    source: "public/images/platform/ceramik-leads.webp",
    title: "See why every lead ranks",
  },
  {
    file: "scorelead-product-hunt-clean-04-pipeline.png",
    source: "public/images/platform/ceramik-pipeline.webp",
    title: "Move your best accounts forward",
  },
  {
    file: "scorelead-product-hunt-clean-05-dashboard.png",
    source: "public/images/platform/ceramik-dashboard.webp",
    title: "One workspace. Every signal.",
  },
];

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function roundedScreenshot(sourcePath) {
  const screenshot = await sharp(sourcePath)
    .resize(1206, 626, { fit: "cover", position: "top" })
    .png()
    .toBuffer();
  const mask = Buffer.from(`
    <svg width="1206" height="626" xmlns="http://www.w3.org/2000/svg">
      <rect width="1206" height="626" rx="14" fill="#fff"/>
    </svg>
  `);
  return sharp(screenshot)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function renderHero() {
  const source =
    "/Users/wrsanches/Desktop/Screenshot 2026-07-27 at 16.43.01.png";
  const output = path.join(
    outputDir,
    "scorelead-product-hunt-clean-01-hero.png",
  );
  await sharp(source)
    .resize(width, height, { fit: "cover", position: "centre" })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
  return output;
}

async function renderProductSlide(slide, index) {
  const screenshot = await roundedScreenshot(path.join(root, slide.source));
  const logo = await sharp(logoPath).resize(28, 28).png().toBuffer();
  const base = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#080909"/>
      <text x="78" y="55" fill="#f7f8f7" font-family="Inter, Arial, sans-serif"
        font-size="20" font-weight="650" letter-spacing="-0.4">ScoreLead</text>
      <text x="240" y="57" fill="#f7f8f7" font-family="Inter, Arial, sans-serif"
        font-size="30" font-weight="570" letter-spacing="-1.1">${escapeXml(slide.title)}</text>
      <text x="1228" y="55" text-anchor="end" fill="#66706d"
        font-family="Inter, Arial, sans-serif" font-size="13" font-weight="650"
        letter-spacing="1.2">0${index + 2} / 05</text>
      <line x1="32" y1="85" x2="1238" y2="85" stroke="#242a28" stroke-width="1"/>
      <rect x="31" y="103" width="1208" height="628" rx="15"
        fill="#0b0d0d" stroke="#303735" stroke-width="1"/>
    </svg>
  `);
  const output = path.join(outputDir, slide.file);
  await sharp(base)
    .composite([
      { input: logo, left: 40, top: 32 },
      { input: screenshot, left: 32, top: 104 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
  return output;
}

await fs.mkdir(outputDir, { recursive: true });

const outputs = [await renderHero()];
for (let index = 0; index < slides.length; index += 1) {
  outputs.push(await renderProductSlide(slides[index], index));
}

await fs.writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(
    {
      product: "ScoreLead",
      platform: "Product Hunt",
      dimensions: { width, height },
      style: "Minimal, product-first",
      outputs,
      notes: [
        "Hero uses the user-captured ScoreLead landing page.",
        "Feature cards preserve populated product-demo screenshots.",
        "No generated product UI, invented copy, or customer claims.",
      ],
    },
    null,
    2,
  )}\n`,
);

console.log(outputs.join("\n"));
