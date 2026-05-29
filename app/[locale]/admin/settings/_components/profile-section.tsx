"use client"

import { useEffect } from "react"
import Image from "next/image"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User as UserIcon, Loader2 } from "lucide-react"

function makeSchema(t: (k: string) => string) {
  return z.object({
    name: z.string().trim().min(2).max(80),
    image: z
      .string()
      .trim()
      .url(t("profileImagePlaceholder"))
      .optional()
      .or(z.literal("")),
  })
}

type ProfileValues = z.infer<ReturnType<typeof makeSchema>>

export function ProfileSection() {
  const t = useTranslations("settings")
  const { data: session, refetch } = authClient.useSession()

  const form = useForm<ProfileValues>({
    resolver: zodResolver(makeSchema(t)),
    defaultValues: { name: "", image: "" },
  })

  useEffect(() => {
    if (session?.user) {
      form.reset({
        name: session.user.name ?? "",
        image: session.user.image ?? "",
      })
    }
  }, [session?.user?.id, session?.user?.name, session?.user?.image, form])

  async function onSubmit(values: ProfileValues) {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          image: values.image ?? "",
        }),
      })
      if (!res.ok) {
        toast.error(t("saveFailed"))
        return
      }
      toast.success(t("saved"), { description: t("savedDescription") })
      refetch?.()
    } catch {
      toast.error(t("saveFailed"))
    }
  }

  const imagePreview = form.watch("image") || session?.user?.image || null
  const submitting = form.formState.isSubmitting

  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-white mb-1">{t("profile")}</h2>
      <p className="text-sm text-zinc-500 mb-6">{t("description")}</p>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5 max-w-lg"
        noValidate
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 overflow-hidden flex items-center justify-center shrink-0">
            {imagePreview ? (
              <Image
                src={imagePreview}
                alt=""
                width={56}
                height={56}
                className="w-full h-full object-cover"
                unoptimized
              />
            ) : (
              <UserIcon className="w-5 h-5 text-zinc-500" />
            )}
          </div>
          <div className="text-xs text-zinc-500">
            {session?.user?.email}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-name" className="text-zinc-700 dark:text-zinc-300">
            {t("displayName")}
          </Label>
          <Input
            id="settings-name"
            placeholder={t("displayNamePlaceholder")}
            className="bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            {...form.register("name")}
          />
          {form.formState.errors.name && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settings-image" className="text-zinc-700 dark:text-zinc-300">
            {t("profileImage")}
          </Label>
          <Input
            id="settings-image"
            type="url"
            placeholder={t("profileImagePlaceholder")}
            className="bg-white dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
            {...form.register("image")}
          />
          {form.formState.errors.image && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {form.formState.errors.image.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label className="text-zinc-700 dark:text-zinc-300">{t("email")}</Label>
          <Input
            value={session?.user?.email ?? ""}
            disabled
            className="bg-zinc-50/80 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 text-zinc-500"
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-600">{t("emailHint")}</p>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? t("saving") : t("save")}
          </Button>
        </div>
      </form>
    </section>
  )
}
