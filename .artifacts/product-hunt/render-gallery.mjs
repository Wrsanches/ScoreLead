import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = "/Users/wrsanches/Developer/scorelead";
const outputDir = path.join(root, ".artifacts/product-hunt");
const logoPath = path.join(root, "public/scorelead-logo.svg");

const WIDTH = 1270;
const HEIGHT = 760;

const colors = {
  bg: "#070909",
  bg2: "#0a100f",
  panel: "#0d1111",
  panel2: "#111716",
  white: "#f7f8f7",
  muted: "#98a09d",
  quiet: "#606966",
  green: "#15d49b",
  mint: "#9cf5d6",
  border: "#26302d",
};

const slides = [
  {
    file: "scorelead-product-hunt-01-hero.png",
    source: "public/images/platform/ceramik-dashboard.webp",
    eyebrow: "AI-NATIVE B2B PROSPECTING",
    title: ["Turn any market", "into a qualified", "B2B pipeline"],
    body: ["Discover, enrich, score, and", "prepare outreach in one flow."],
    chips: ["Discover", "Enrich", "Score", "Outreach"],
  },
  {
    file: "scorelead-product-hunt-02-discovery.png",
    source: "public/images/platform/ceramik-discovery.webp",
    eyebrow: "ACCOUNT DISCOVERY",
    title: ["Find companies", "that actually fit"],
    body: ["Search by market, geography,", "service, and account profile."],
    chips: ["Public web signals", "Source-aware", "Deduplicated"],
  },
  {
    file: "scorelead-product-hunt-03-scoring.png",
    source: "public/images/platform/ceramik-leads.webp",
    eyebrow: "EXPLAINABLE SCORING",
    title: ["Know why every", "lead ranks"],
    body: ["Keep the evidence behind each", "priority—not just a black-box score."],
    chips: ["Fit", "Reach", "Trust", "Readiness"],
  },
  {
    file: "scorelead-product-hunt-04-pipeline.png",
    source: "public/images/platform/ceramik-pipeline.webp",
    eyebrow: "ONE CONNECTED WORKFLOW",
    title: ["Advance your best", "accounts"],
    body: ["Keep research, scoring, outreach,", "and pipeline status connected."],
    chips: ["New", "Contacted", "Interested", "Won"],
  },
];

function esc(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function brandSvg() {
  return `
    <text x="97" y="70" fill="${colors.white}" font-family="Inter, Arial, sans-serif"
      font-size="25" font-weight="650" letter-spacing="-0.6">ScoreLead</text>
    <text x="1216" y="70" text-anchor="end" fill="${colors.quiet}"
      font-family="Inter, Arial, sans-serif" font-size="15" font-weight="600">scorelead.io</text>
  `;
}

function headlineSvg(lines, x = 54, y = 190, size = 51, leading = 58) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * leading}" fill="${colors.white}"
          font-family="Inter, Arial, sans-serif" font-size="${size}" font-weight="630"
          letter-spacing="-2.2">${esc(line)}</text>`,
    )
    .join("\n");
}

function bodySvg(lines, x = 56, y = 388) {
  return lines
    .map(
      (line, index) =>
        `<text x="${x}" y="${y + index * 27}" fill="${colors.muted}"
          font-family="Inter, Arial, sans-serif" font-size="20" font-weight="430"
          letter-spacing="-0.2">${esc(line)}</text>`,
    )
    .join("\n");
}

function chipSvg(chips, y = 632) {
  let x = 54;
  return chips
    .map((chip) => {
      const width = Math.max(74, 24 + chip.length * 8.1);
      const out = `
        <rect x="${x}" y="${y}" width="${width}" height="34" rx="17"
          fill="#0d1714" stroke="#1d4f3f" stroke-width="1"/>
        <circle cx="${x + 17}" cy="${y + 17}" r="3.5" fill="${colors.green}"/>
        <text x="${x + 28}" y="${y + 22}" fill="#c9d2cf"
          font-family="Inter, Arial, sans-serif" font-size="13" font-weight="560">${esc(chip)}</text>
      `;
      x += width + 9;
      return out;
    })
    .join("\n");
}

function backgroundSvg(slide, index) {
  const eyebrowWidth = Math.max(174, 30 + slide.eyebrow.length * 8.2);
  return Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.bg}"/>
          <stop offset="68%" stop-color="${colors.bg2}"/>
          <stop offset="100%" stop-color="#091511"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#12c98f" stop-opacity=".24"/>
          <stop offset="100%" stop-color="#12c98f" stop-opacity="0"/>
        </radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="42"/></filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
      <circle cx="1110" cy="48" r="215" fill="url(#glow)" filter="url(#soft)"/>
      <circle cx="414" cy="748" r="180" fill="url(#glow)" opacity=".26" filter="url(#soft)"/>
      <path d="M0 706 C260 650 416 736 684 680 C900 635 1060 666 1270 590"
        fill="none" stroke="#123d31" stroke-opacity=".33" stroke-width="1"/>
      <rect x="54" y="108" width="${eyebrowWidth}" height="32" rx="16"
        fill="#0d1714" stroke="#1d4f3f" stroke-width="1"/>
      <circle cx="71" cy="124" r="3.5" fill="${colors.green}"/>
      <text x="82" y="129" fill="${colors.mint}" font-family="Inter, Arial, sans-serif"
        font-size="12" font-weight="700" letter-spacing="1.1">${esc(slide.eyebrow)}</text>
      ${brandSvg()}
      ${headlineSvg(slide.title)}
      ${bodySvg(slide.body)}
      ${chipSvg(slide.chips)}
      <text x="1216" y="716" text-anchor="end" fill="#53605c"
        font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700"
        letter-spacing="1.7">0${index + 1} / 05</text>
    </svg>
  `);
}

async function roundedPanel(sourcePath, width, height, position = "centre") {
  const screenshot = await sharp(sourcePath)
    .resize(width, height, { fit: "cover", position })
    .png()
    .toBuffer();

  const mask = Buffer.from(`
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="${width}" height="${height}" rx="20" fill="#fff"/>
    </svg>
  `);

  return sharp(screenshot)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function renderStandardSlide(slide, index) {
  const panelWidth = 790;
  const panelHeight = 494;
  const panelLeft = 436;
  const panelTop = 151;
  const panel = await roundedPanel(path.join(root, slide.source), panelWidth, panelHeight);
  const frame = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="22" stdDeviation="26" flood-color="#000" flood-opacity=".66"/>
        </filter>
      </defs>
      <rect x="${panelLeft - 1}" y="${panelTop - 1}" width="${panelWidth + 2}" height="${panelHeight + 2}"
        rx="21" fill="#0e1412" stroke="#2d3c37" stroke-width="1.2" filter="url(#shadow)"/>
      <circle cx="${panelLeft + 21}" cy="${panelTop + 18}" r="4" fill="#ff6b5f"/>
      <circle cx="${panelLeft + 37}" cy="${panelTop + 18}" r="4" fill="#f2bd4d"/>
      <circle cx="${panelLeft + 53}" cy="${panelTop + 18}" r="4" fill="#23c973"/>
    </svg>
  `);

  const logo = await sharp(logoPath).resize(34, 34).png().toBuffer();
  const outputPath = path.join(outputDir, slide.file);
  await sharp(backgroundSvg(slide, index))
    .composite([
      { input: frame, left: 0, top: 0 },
      { input: panel, left: panelLeft, top: panelTop },
      { input: logo, left: 54, top: 43 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  return outputPath;
}

async function renderProofSlide() {
  const source = path.join(root, "public/images/platform/ceramik-case-study.webp");
  const panelWidth = 706;
  const panelHeight = 367;
  const panelLeft = 518;
  const panelTop = 342;
  const panel = await roundedPanel(source, panelWidth, panelHeight, "top");
  const logo = await sharp(logoPath).resize(34, 34).png().toBuffer();

  const proofSvg = Buffer.from(`
    <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${colors.bg}"/>
          <stop offset="72%" stop-color="${colors.bg2}"/>
          <stop offset="100%" stop-color="#0a1713"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#12c98f" stop-opacity=".22"/>
          <stop offset="100%" stop-color="#12c98f" stop-opacity="0"/>
        </radialGradient>
        <filter id="shadow" x="-30%" y="-30%" width="160%" height="170%">
          <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="#000" flood-opacity=".65"/>
        </filter>
      </defs>
      <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>
      <circle cx="1090" cy="60" r="230" fill="url(#glow)"/>
      ${brandSvg()}
      <rect x="54" y="108" width="282" height="32" rx="16"
        fill="#0d1714" stroke="#1d4f3f" stroke-width="1"/>
      <circle cx="71" cy="124" r="3.5" fill="${colors.green}"/>
      <text x="82" y="129" fill="${colors.mint}" font-family="Inter, Arial, sans-serif"
        font-size="12" font-weight="700" letter-spacing="1.1">CUSTOMER-REPORTED · FIRST 30 DAYS</text>
      ${headlineSvg(["Less list building.", "More qualified", "conversations."], 54, 198, 47, 54)}
      <text x="56" y="408" fill="${colors.muted}" font-family="Inter, Arial, sans-serif"
        font-size="18" font-weight="430">Ceramik compared ScoreLead with its</text>
      <text x="56" y="434" fill="${colors.muted}" font-family="Inter, Arial, sans-serif"
        font-size="18" font-weight="430">previous manual research workflow.</text>

      <g transform="translate(518 132)">
        <rect width="218" height="150" rx="18" fill="#0d1412" stroke="#1f4a3d"/>
        <text x="22" y="64" fill="${colors.white}" font-family="Inter, Arial, sans-serif"
          font-size="49" font-weight="680" letter-spacing="-2">2,450</text>
        <text x="22" y="101" fill="${colors.mint}" font-family="Inter, Arial, sans-serif"
          font-size="14" font-weight="650">company leads discovered</text>
        <text x="22" y="125" fill="${colors.quiet}" font-family="Inter, Arial, sans-serif"
          font-size="12">during the first 30 days</text>
      </g>
      <g transform="translate(750 132)">
        <rect width="218" height="150" rx="18" fill="#10130d" stroke="#4a4119"/>
        <text x="22" y="64" fill="${colors.white}" font-family="Inter, Arial, sans-serif"
          font-size="49" font-weight="680" letter-spacing="-2">10×</text>
        <text x="22" y="101" fill="#f1cf61" font-family="Inter, Arial, sans-serif"
          font-size="14" font-weight="650">pipeline growth</text>
        <text x="22" y="125" fill="${colors.quiet}" font-family="Inter, Arial, sans-serif"
          font-size="12">customer-reported</text>
      </g>
      <g transform="translate(982 132)">
        <rect width="242" height="150" rx="18" fill="#0d1215" stroke="#24485d"/>
        <text x="22" y="64" fill="${colors.white}" font-family="Inter, Arial, sans-serif"
          font-size="49" font-weight="680" letter-spacing="-2">85%</text>
        <text x="22" y="101" fill="#77c9f4" font-family="Inter, Arial, sans-serif"
          font-size="14" font-weight="650">less research time</text>
        <text x="22" y="125" fill="${colors.quiet}" font-family="Inter, Arial, sans-serif"
          font-size="12">customer-reported</text>
      </g>

      <rect x="${panelLeft - 1}" y="${panelTop - 1}" width="${panelWidth + 2}" height="${panelHeight + 2}"
        rx="21" fill="#0e1412" stroke="#2d3c37" stroke-width="1.2" filter="url(#shadow)"/>
      <text x="56" y="608" fill="${colors.quiet}" font-family="Inter, Arial, sans-serif"
        font-size="12.5">Directional customer evidence; not independently audited.</text>
      <text x="56" y="632" fill="${colors.quiet}" font-family="Inter, Arial, sans-serif"
        font-size="12.5">Results depend on market, targeting, review, and outreach.</text>
      <text x="1216" y="716" text-anchor="end" fill="#53605c"
        font-family="Inter, Arial, sans-serif" font-size="13" font-weight="700"
        letter-spacing="1.7">05 / 05</text>
    </svg>
  `);

  const outputPath = path.join(outputDir, "scorelead-product-hunt-05-proof.png");
  await sharp(proofSvg)
    .composite([
      { input: panel, left: panelLeft, top: panelTop },
      { input: logo, left: 54, top: 43 },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(outputPath);
  return outputPath;
}

await fs.mkdir(outputDir, { recursive: true });
const outputs = [];
for (let index = 0; index < slides.length; index += 1) {
  outputs.push(await renderStandardSlide(slides[index], index));
}
outputs.push(await renderProofSlide());

const manifest = {
  product: "ScoreLead",
  platform: "Product Hunt",
  dimensions: { width: WIDTH, height: HEIGHT },
  generatedAt: new Date().toISOString(),
  outputs: outputs.map((output, index) => ({
    order: index + 1,
    path: output,
    source:
      index < slides.length
        ? path.join(root, slides[index].source)
        : path.join(root, "public/images/platform/ceramik-case-study.webp"),
  })),
  notes: [
    "Exact ScoreLead screenshots and logo preserved through deterministic composition.",
    "Proof metrics are customer-reported claims already published in the ScoreLead marketing content.",
    "All files exported at Product Hunt's recommended 1270x760 gallery size.",
  ],
};

await fs.writeFile(
  path.join(outputDir, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
);

console.log(outputs.join("\n"));
