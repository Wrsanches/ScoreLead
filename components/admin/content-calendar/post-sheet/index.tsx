"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, Sparkles, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { ContentPostRow } from "../types";
import { type PostFormValues, blank, fromPost } from "./shared";
import { ImagePane } from "./image-pane";
import { InstagramPreview } from "./instagram-preview";
import { PostFormFields } from "./post-form-fields";
import { ReferenceImagePicker } from "../reference-image-picker";

export type { PostFormValues };

interface PostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: string;
  post: ContentPostRow | null;
  draftDate: Date | null;
  onSave: (values: PostFormValues) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onGenerateImage?: (postId: string) => Promise<{ failureIndexes: number[] }>;
  onRegenerateSlide?: (
    postId: string,
    slideIndex: number,
    refinementPrompt?: string,
  ) => Promise<void>;
  onUploadSlide?: (
    postId: string,
    slideIndex: number,
    file: File,
    headline: string,
  ) => Promise<void>;
  readOnly?: boolean;
}

export function PostSheet({ open, onOpenChange, ...rest }: PostSheetProps) {
  const { post, draftDate } = rest;
  // Remounting the body per post (and per open) replaces effect-based form
  // reset: switching posts starts clean, while parent updates to the SAME post
  // (e.g. a freshly generated image) keep in-flight caption edits.
  const bodyKey = post ? post.id : `new-${draftDate?.getTime() ?? 0}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-5xl! w-full bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 p-0 flex flex-col gap-0"
      >
        {open && <PostSheetBody key={bodyKey} {...rest} />}
      </SheetContent>
    </Sheet>
  );
}

function PostSheetBody({
  businessId,
  post,
  draftDate,
  onSave,
  onDelete,
  onGenerateImage,
  onRegenerateSlide,
  onUploadSlide,
  readOnly = false,
}: Omit<PostSheetProps, "open" | "onOpenChange">) {
  const t = useTranslations("contentCalendar");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [values, setValues] = useState<PostFormValues>(() =>
    post ? fromPost(post) : blank(draftDate),
  );

  const isNew = !post;

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await onSave(values);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !onDelete || deleting) return;
    setDeleting(true);
    try {
      await onDelete(post.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <SheetHeader className="border-b border-zinc-200 dark:border-zinc-800 px-5 py-4">
        <SheetTitle className="text-zinc-900 dark:text-white flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          {isNew ? t("newPost") : t("editPost")}
        </SheetTitle>
        <SheetDescription className="text-zinc-500 text-xs">
          {t("subtitle")}
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[26rem_1fr]">
        {/* Left: live Instagram preview */}
        <div className="border-b lg:border-b-0 lg:border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/20 px-5 py-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
          {post && onGenerateImage && !readOnly ? (
            <ImagePane
              post={post}
              businessId={businessId}
              caption={values.caption}
              hashtags={values.hashtags}
              postType={values.postType}
              scheduledFor={values.scheduledFor}
              onGenerateImage={onGenerateImage}
              onRegenerateSlide={onRegenerateSlide}
              onUploadSlide={onUploadSlide}
              referenceSlot={
                <ReferenceImagePicker
                  postId={post.id}
                  businessId={businessId}
                  initialPref={post.referenceImagePref}
                />
              }
            />
          ) : (
            <div className="space-y-3">
              <InstagramPreview
                businessId={businessId}
                images={post?.images ?? []}
                index={0}
                onIndexChange={() => {}}
                caption={values.caption}
                hashtags={values.hashtags}
                postType={values.postType}
                scheduledFor={values.scheduledFor}
                generating={false}
                regeneratingIndex={null}
                imageFailures={[]}
                onExpand={() => {}}
              />
              {!readOnly && (
                <p className="mx-auto w-full max-w-sm text-center text-[11px] text-zinc-500 dark:text-zinc-600">
                  {t("imageAfterSaveHint")}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: compose controls */}
        <div className="px-5 py-6 lg:h-full lg:min-h-0 lg:overflow-y-auto">
          <fieldset disabled={readOnly}>
            <PostFormFields
              values={values}
              onChange={(patch) => setValues((v) => ({ ...v, ...patch }))}
            />
          </fieldset>
        </div>
      </div>

      {!readOnly && (
      <div className="border-t border-zinc-200 dark:border-zinc-800 px-5 py-3 flex items-center gap-2">
        {!isNew && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            {t("deletePost")}
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition-colors disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          {t("save")}
        </button>
      </div>
      )}
    </>
  );
}
