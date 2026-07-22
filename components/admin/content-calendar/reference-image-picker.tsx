"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProductImage, ReferenceImagePref } from "@/lib/product-images";
import { microLabelClass } from "./post-sheet/shared";

interface ReferenceImagePickerProps {
  postId: string;
  businessId: string;
  initialPref: ReferenceImagePref | null;
}

// Product images per business, cached for the session - the sheet reopens
// often and the list only changes on the profile page.
const productImagesCache = new Map<string, Promise<ProductImage[]>>();

function fetchProductImages(businessId: string): Promise<ProductImage[]> {
  let cached = productImagesCache.get(businessId);
  if (!cached) {
    cached = fetch(`/api/businesses/${businessId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data) => (data?.productImages ?? []) as ProductImage[],
      )
      .catch(() => [] as ProductImage[]);
    productImagesCache.set(businessId, cached);
    // Don't cache failures/empties forever; a later open should retry.
    cached.then((imgs) => {
      if (imgs.length === 0) productImagesCache.delete(businessId);
    });
  }
  return cached;
}

/**
 * Per-post override for which business product image the generator should
 * reference: Auto (AI decides), None, or a specific image. Persists straight
 * to the post via PATCH so a following "Generate" always uses what is shown,
 * even before the form is saved. Renders nothing when the business has no
 * product images.
 */
export function ReferenceImagePicker({
  postId,
  businessId,
  initialPref,
}: ReferenceImagePickerProps) {
  const t = useTranslations("contentCalendar");
  const [images, setImages] = useState<ProductImage[] | null>(null);
  const [pref, setPref] = useState<ReferenceImagePref>(
    initialPref ?? { mode: "auto" },
  );

  useEffect(() => {
    let cancelled = false;
    fetchProductImages(businessId).then((imgs) => {
      if (!cancelled) setImages(imgs);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  if (!images || images.length === 0) return null;

  async function updatePref(next: ReferenceImagePref) {
    const previous = pref;
    setPref(next);
    try {
      const res = await fetch(`/api/content-calendar/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceImagePref: next }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      setPref(previous);
    }
  }

  const selectedId =
    pref.mode === "specific" &&
    images.some((img) => img.id === pref.imageId)
      ? pref.imageId
      : null;

  const chipClass = (active: boolean) =>
    `px-2 py-1 rounded-md text-[10px] font-medium border transition-colors ${
      active
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
    }`;

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className={microLabelClass}>{t("referenceImage")}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => updatePref({ mode: "auto" })}
            className={chipClass(pref.mode === "auto")}
          >
            {t("referenceAuto")}
          </button>
          <button
            type="button"
            onClick={() => updatePref({ mode: "none" })}
            className={chipClass(pref.mode === "none")}
          >
            {t("referenceNone")}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {images.map((img) => {
          const active = selectedId === img.id;
          return (
            <button
              key={img.id}
              type="button"
              onClick={() => updatePref({ mode: "specific", imageId: img.id })}
              title={img.description || undefined}
              className={`relative shrink-0 w-11 h-11 rounded-lg overflow-hidden border-2 transition-all ${
                active
                  ? "border-emerald-500"
                  : "border-transparent ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-zinc-400 dark:hover:ring-zinc-600 opacity-80 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={img.description || ""}
                fill
                className="object-cover"
                sizes="44px"
                unoptimized
              />
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-600 leading-relaxed">
        {t("referenceImageHint")}
      </p>
    </div>
  );
}
