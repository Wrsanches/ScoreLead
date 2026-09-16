"use client";

import { use } from "react";
import { PostEditor } from "@/components/admin/content-calendar/post-editor/post-editor";

/**
 * Post editor page. `new` opens a blank post (optionally seeded with `?date=`);
 * any other id opens that post for editing.
 */
export default function ContentPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ postId: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { postId } = use(params);
  const { date } = use(searchParams);
  // A new post gets a fresh editor per opened date; an existing post remounts
  // when the id changes so no state leaks between posts.
  return (
    <PostEditor
      key={postId === "new" ? `new-${date ?? ""}` : postId}
      postId={postId === "new" ? null : postId}
      draftDate={date ?? null}
    />
  );
}
