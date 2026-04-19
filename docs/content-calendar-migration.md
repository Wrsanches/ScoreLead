# Content Calendar - DB setup

The Content Calendar feature adds a new `content_post` table via `drizzle/0012_whole_spacker_dave.sql` and an `images` jsonb column via `drizzle/0013_spicy_black_cat.sql` for storing carousel slides (one entry for single/reel posts, multiple entries for carousels).

Your database had **6 orphan tables** from a previous abandoned attempt at this feature (see row counts below). These conflict with the new schema, so they must be dropped before applying the migration.

| Table | Rows at cleanup time |
|---|---|
| `content_post` | 13 |
| `content_plan` | 1 |
| `content_image` | 6 |
| `social_content_plan` | 1 |
| `social_post_asset` | 6 |
| `social_post_suggestion` | 10 |

No code in the repo references these tables.

## Run once

From the repo root:

```bash
bun -e 'import("pg").then(async({default:pg})=>{const c=new pg.Client(process.env.DATABASE_URL);await c.connect();for(const t of ["social_post_asset","social_post_suggestion","social_content_plan","content_image","content_post","content_plan"]){await c.query(`DROP TABLE IF EXISTS "${t}" CASCADE`);console.log("dropped",t)}await c.end()})' && bun db:migrate
```

This:

1. Drops the 6 orphan tables (CASCADE clears their foreign keys).
2. Runs `drizzle-kit migrate`, which applies `0012_whole_spacker_dave.sql` + `0013_spicy_black_cat.sql` and brings `content_post` to the shape defined in `lib/db/schema.ts`.

## Verify

```bash
bun -e 'import("pg").then(async({default:pg})=>{const c=new pg.Client(process.env.DATABASE_URL);await c.connect();const r=await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 ORDER BY ordinal_position`,["content_post"]);console.log(r.rows.map(x=>x.column_name).join(", "));await c.end()})'
```

Expected columns:
`id, userId, businessId, provider, scheduledFor, postType, pillar, caption, hashtags, visualIdea, callToAction, images, status, aiGenerated, createdAt, updatedAt`

Then visit `/admin/content-calendar` and click **Generate with AI**.

## Image generation (Nano Banana Pro)

Post images are rendered with Google's `gemini-3-pro-image-preview` (Nano Banana Pro). Requirements:

- `GEMINI_API_KEY` set in `.env.local` (already present).
- Generated PNGs are written to `public/generated/content-images/{postId}-{slideIndex}-{timestamp}.png` and referenced via relative URL inside the `content_post.images` jsonb array.
- Aspect ratio follows post type: `single`/`carousel` → 4:5, `reel`/`story` → 9:16. Resolution is 2K.
- For **carousels**, the caption is first split into 4-7 slide headlines by GPT (cover + body slides + optional CTA). Each slide gets its own Gemini call, all fired in parallel, with an enforced cohesion clause so they feel like one shoot.
- For single/reel posts, the `images` array has exactly one entry.
- `images[i]` stores `{ url, headline, prompt }`: the PNG URL, the headline overlaid on that slide, and the full prompt sent to Gemini.

Open any post in the calendar and click **Generate image** in the sheet. Regenerating overwrites the DB row and saves a new file (old files are not auto-cleaned — safe to delete `public/generated/content-images/` contents anytime to reclaim disk space).
