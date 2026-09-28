# Fictional showcase brand logos

Generated on 2026-09-28 through the imagegen skill's explicit API/CLI mode,
using the project's existing `OPENAI_API_KEY` and `gpt-image-2.5-sunburst`.
No key is stored in these files. Generation used `generate-batch`, 1024×1024,
high quality, one image per prompt, and concurrency 3.

Exact prompts: `showcase-logo-prompts.jsonl`.
Original PNGs: `showcase-logos/{brand}.png`.
Visual overview: `showcase-logos/preview.png`.
Production assets: `../../public/images/showcase/{brand}.webp`.

Brands: `vora-studio`, `lume-social`, `mora-casa`, `nova-forma`, `dia-papel`.
The WebP assets are 128×128 at quality 90, resized from the originals with Sharp.
Together they weigh 5,710 bytes. The shared ContentShowcase component renders
them on both the homepage and content-calendar empty state, at 24px in the
avatar and 16px in the signature.

Original brief: create stronger logos for the existing fictional companies in
the animated posts, preserving their palettes and making each mark legible at
small sizes. Each prompt requests a single symbol without a wordmark.
