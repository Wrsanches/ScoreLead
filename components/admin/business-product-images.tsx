"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, Plus, X } from "lucide-react"
import { uploadImage, UploadError } from "@/lib/upload-client"
import { MAX_PRODUCT_IMAGES, type ProductImage } from "@/lib/product-images"

interface BusinessProductImagesProps {
  value: ProductImage[]
  onChange: (next: ProductImage[]) => void
  max?: number
}

/**
 * Manager for the business's product images (photos/screenshots the AI can
 * reference when generating post images). Uploads go straight to S3; the URLs
 * are persisted with the rest of the business edit form on save.
 */
export function BusinessProductImages({
  value,
  onChange,
  max = MAX_PRODUCT_IMAGES,
}: BusinessProductImagesProps) {
  const t = useTranslations("business")
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ""
    if (files.length === 0) return

    const room = max - value.length
    if (room <= 0) {
      toast.error(t("productImagesMax"))
      return
    }

    setUploading(true)
    const added: ProductImage[] = []
    try {
      for (const file of files.slice(0, room)) {
        try {
          const { url } = await uploadImage(file, {
            kind: "business-product",
            maxBytes: 4 * 1024 * 1024,
          })
          added.push({ id: crypto.randomUUID(), url, description: "" })
        } catch (err) {
          toast.error(
            err instanceof UploadError ? err.message : t("uploadFailed"),
          )
        }
      }
      if (files.length > room) toast.error(t("productImagesMax"))
    } finally {
      setUploading(false)
    }
    if (added.length > 0) onChange([...value, ...added])
  }

  function setDescription(id: string, description: string) {
    onChange(
      value.map((img) => (img.id === id ? { ...img, description } : img)),
    )
  }

  function remove(id: string) {
    onChange(value.filter((img) => img.id !== id))
  }

  return (
    <div>
      <p className="text-[10px] text-zinc-500 dark:text-zinc-600 mb-3 leading-relaxed">
        {t("productImagesHint")}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {value.map((img) => (
          <div
            key={img.id}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 overflow-hidden"
          >
            <div className="relative aspect-square bg-white dark:bg-zinc-900">
              <Image
                src={img.url}
                alt={img.description || ""}
                fill
                className="object-cover"
                sizes="160px"
                unoptimized
              />
              <button
                type="button"
                onClick={() => remove(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white/90 dark:bg-zinc-950/80 hover:bg-red-500/90 hover:text-white border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 transition-colors"
                aria-label={t("removeProductImage")}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-1.5">
              <textarea
                value={img.description}
                onChange={(e) =>
                  setDescription(img.id, e.target.value.slice(0, 500))
                }
                placeholder={t("productImageDescriptionPlaceholder")}
                rows={2}
                className="w-full px-2 py-1.5 bg-transparent text-[11px] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-lg border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 focus:outline-none focus:border-emerald-500/30 focus:ring-1 focus:ring-emerald-500/20 transition-all resize-none"
              />
              {!img.description.trim() && (
                <p className="px-2 pb-0.5 text-[9px] text-amber-600/80 dark:text-amber-400/70">
                  {t("productImageDescribeNudge")}
                </p>
              )}
            </div>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-emerald-500/40 hover:bg-emerald-500/5 flex flex-col items-center justify-center gap-1.5 text-zinc-500 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            <span className="text-[10px] font-medium">
              {t("addProductImage")}
            </span>
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
    </div>
  )
}
