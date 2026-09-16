"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, Clock3 } from "lucide-react";
import { enUS, es as esLocale, ptBR } from "react-day-picker/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fieldClass } from "./shared";

const DAY_PICKER_LOCALES = { en: enUS, pt: ptBR, es: esLocale } as const;

/** Common Instagram posting slots, offered as one-tap chips. */
const QUICK_TIMES = ["09:00", "11:00", "13:00", "17:00", "19:00"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function withTime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const next = new Date(date);
  next.setHours(h, m, 0, 0);
  return next;
}

function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

interface SchedulePickerProps {
  id?: string;
  /** ISO timestamp. */
  value: string;
  onChange: (iso: string) => void;
  disabled?: boolean;
}

/**
 * Date and time picker for "When to post": a real month calendar with the
 * business's week start, one-tap quick times, and a time field for anything
 * else. Replaces the browser's datetime-local control, which looks different
 * in every browser and is fiddly on a trackpad.
 */
export function SchedulePicker({ id, value, onChange, disabled }: SchedulePickerProps) {
  const t = useTranslations("contentCalendar");
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const current = useMemo(() => {
    const d = new Date(value);
    return Number.isFinite(d.getTime()) ? d : withTime(new Date(), "11:00");
  }, [value]);
  const time = `${pad(current.getHours())}:${pad(current.getMinutes())}`;
  const dayPickerLocale =
    DAY_PICKER_LOCALES[locale as keyof typeof DAY_PICKER_LOCALES] ?? enUS;
  const weekStartsOn: 0 | 1 = locale === "en" ? 0 : 1;

  const dateLabel = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: current.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  }).format(current);
  const timeLabel = new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
  }).format(current);

  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

  function pickDate(date: Date) {
    onChange(withTime(date, time).toISOString());
  }

  function pickTime(next: string) {
    if (!/^\d{2}:\d{2}$/.test(next)) return;
    onChange(withTime(current, next).toISOString());
  }

  const chipClass = (active: boolean) =>
    `inline-flex h-8 items-center justify-center whitespace-nowrap rounded-lg px-2.5 text-xs font-medium transition-colors ${
      active
        ? "bg-emerald-500 text-zinc-950"
        : "glass-pill text-zinc-700 hover:brightness-110 dark:text-zinc-300"
    }`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          className={`${fieldClass} flex items-center gap-3 text-left sm:max-w-sm disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <CalendarClock className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
          <span className="min-w-0 flex-1 truncate whitespace-nowrap">
            <span className="font-medium capitalize">{dateLabel}</span>
            <span className="text-zinc-400 dark:text-zinc-600"> · </span>
            <span className="tabular-nums">{timeLabel}</span>
          </span>
          {isSameDay(current, today) ? (
            <span className="shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300">
              {t("today")}
            </span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="glass-strong w-auto rounded-2xl border-transparent p-0"
      >
        <div className="flex flex-col sm:flex-row">
          <div className="p-2">
            <div className="flex gap-1.5 px-1 pt-1">
              <button type="button" onClick={() => pickDate(today)} className={chipClass(isSameDay(current, today))}>
                {t("today")}
              </button>
              <button type="button" onClick={() => pickDate(tomorrow)} className={chipClass(isSameDay(current, tomorrow))}>
                {t("tomorrow")}
              </button>
            </div>
            <Calendar
              mode="single"
              selected={current}
              onSelect={(date) => date && pickDate(date)}
              defaultMonth={current}
              locale={dayPickerLocale}
              weekStartsOn={weekStartsOn}
              showOutsideDays={false}
              className="bg-transparent"
              classNames={{
                today: "text-emerald-600 dark:text-emerald-400 font-semibold rounded-md data-[selected=true]:text-current",
              }}
            />
          </div>

          <div className="border-t border-black/[0.06] p-4 dark:border-white/[0.08] sm:w-56 sm:border-l sm:border-t-0">
            <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
              <Clock3 className="size-3.5" aria-hidden="true" />
              {t("timeLabel")}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {QUICK_TIMES.map((slot) => (
                <button key={slot} type="button" onClick={() => pickTime(slot)} className={`${chipClass(time === slot)} px-2 tabular-nums`}>
                  {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" }).format(withTime(current, slot))}
                </button>
              ))}
            </div>
            <input
              type="time"
              value={time}
              step={300}
              onChange={(e) => pickTime(e.target.value)}
              aria-label={t("timeLabel")}
              className={`${fieldClass} mt-3 scheme-dark tabular-nums`}
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 inline-flex h-9 w-full items-center justify-center rounded-xl bg-emerald-500 text-sm font-semibold text-zinc-950 transition-colors hover:bg-emerald-400"
            >
              {t("done")}
            </button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
