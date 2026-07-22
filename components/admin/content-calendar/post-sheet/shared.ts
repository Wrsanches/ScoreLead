import { Square, Images, Film, BookOpen } from "lucide-react";
import type { ContentPillar, ContentPostType } from "@/lib/content-pillars";
import type { ContentPostRow } from "../types";

export interface PostFormValues {
  scheduledFor: string;
  postType: ContentPostType;
  pillar: ContentPillar | null;
  caption: string;
  hashtags: string[];
  visualIdea: string;
  callToAction: string;
  status: "draft" | "approved";
}

export const POST_TYPE_ICON: Record<ContentPostType, typeof Square> = {
  single: Square,
  carousel: Images,
  reel: Film,
  story: BookOpen,
};

export const POST_TYPE_LABEL_KEY: Record<ContentPostType, string> = {
  single: "postTypeSingle",
  carousel: "postTypeCarousel",
  reel: "postTypeReel",
  story: "postTypeStory",
};

export const PILLAR_LABEL_KEY: Record<ContentPillar, string> = {
  educate: "pillarEducate",
  showcase: "pillarShowcase",
  story: "pillarStory",
  proof: "pillarProof",
  engagement: "pillarEngagement",
};

// Shared input styling - matches the admin zinc/emerald field convention.
export const fieldClass =
  "w-full px-3.5 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/30 focus:ring-2 focus:ring-emerald-500/20 transition-all";

export const microLabelClass =
  "text-xs uppercase tracking-wider text-zinc-500 font-medium";

export function imageAspectClass(postType: ContentPostType): string {
  return postType === "reel" || postType === "story"
    ? "aspect-[9/16]"
    : "aspect-[4/5]";
}

export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function fromLocalInputValue(v: string): string {
  const d = new Date(v);
  return d.toISOString();
}

export function blank(draftDate: Date | null): PostFormValues {
  const base = draftDate ?? new Date();
  const d = new Date(base);
  d.setHours(11, 0, 0, 0);
  return {
    scheduledFor: d.toISOString(),
    postType: "single",
    pillar: "educate",
    caption: "",
    hashtags: [],
    visualIdea: "",
    callToAction: "",
    status: "draft",
  };
}

export function fromPost(post: ContentPostRow): PostFormValues {
  return {
    scheduledFor: post.scheduledFor,
    postType: post.postType,
    pillar: post.pillar,
    caption: post.caption,
    hashtags: post.hashtags ?? [],
    visualIdea: post.visualIdea ?? "",
    callToAction: post.callToAction ?? "",
    status: post.status,
  };
}
