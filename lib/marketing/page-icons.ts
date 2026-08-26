import {
  Activity,
  BadgeCheck,
  BarChart3,
  Blocks,
  BookOpen,
  Boxes,
  Building2,
  Calculator,
  CalendarClock,
  CircleHelp,
  ClipboardList,
  Compass,
  Crosshair,
  Database,
  Download,
  Eye,
  FileCheck,
  FileText,
  Fingerprint,
  FlaskConical,
  Gauge,
  GitMerge,
  Globe2,
  Handshake,
  Hourglass,
  Languages,
  Layers,
  LayoutDashboard,
  ListChecks,
  Lock,
  Mail,
  Microscope,
  Monitor,
  Newspaper,
  Paperclip,
  PenLine,
  Percent,
  Printer,
  Quote,
  Radar,
  RefreshCw,
  Repeat,
  Route,
  Scale,
  Server,
  ShieldCheck,
  SlidersHorizontal,
  Split,
  Table2,
  Timer,
  TrendingUp,
  UserCheck,
  Users,
  Wallet,
  Workflow,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { MarketingPageGroup } from "./types";

/**
 * Icons are curated per page so each one maps to the meaning of the
 * highlight it sits above, in the same order as `translation.highlights`.
 * They are navigational anchors, not decoration - if a highlight changes
 * meaningfully, change its icon with it.
 *
 * `ShieldCheck` is reserved for the "Evidence and limits" panel and
 * `FileText` for the content-methodology note, so neither collides with a
 * highlight icon on the same page.
 */
const highlightIcons: Record<string, LucideIcon[]> = {
  "feature-ai-lead-discovery": [Radar, GitMerge, Workflow],
  "feature-lead-scoring": [Split, BarChart3, Gauge],
  "feature-lead-enrichment": [Database, Table2, CircleHelp],
  "feature-outreach-automation": [PenLine, FileCheck, Languages],
  "feature-sales-pipeline": [Route, LayoutDashboard, RefreshCw],

  "use-case-agencies": [Boxes, Repeat, Download],
  "use-case-b2b-sales-teams": [ClipboardList, Gauge, RefreshCw],
  "use-case-b2b-startups": [FlaskConical, Crosshair, ClipboardList],
  "use-case-b2b-companies": [Scale, Languages, GitMerge],

  "compare-manual-lead-research": [PenLine, Zap, Handshake],
  "compare-spreadsheets": [Table2, Workflow, Paperclip],
  "compare-sales-prospecting-software": [Compass, Microscope, BarChart3],
  "compare-purchased-lead-lists": [Hourglass, Radar, Lock],
  "compare-best-lead-scoring-software": [
    Blocks,
    SlidersHorizontal,
    FlaskConical,
  ],
  "compare-b2b-lead-enrichment-tools": [BadgeCheck, Globe2, FileCheck],

  "case-study-ceramik": [Building2, TrendingUp, Timer],

  "company-pricing": [Wallet, Zap, TrendingUp],
  "company-security": [Lock, Server, FileCheck],
  "company-about": [Building2, Languages, Eye],
  "company-editorial-policy": [Quote, UserCheck, Languages],
  "author-scorelead-editorial": [Newspaper, CalendarClock, Mail],

  "tool-icp-worksheet": [BadgeCheck, Monitor, Printer, Building2, ListChecks],
  "tool-lead-scoring-calculator": [
    SlidersHorizontal,
    Calculator,
    Lock,
    Gauge,
    Scale,
  ],
  "tool-enrichment-checklist": [
    ListChecks,
    Activity,
    Lock,
    Fingerprint,
    GitMerge,
  ],
  "tool-roi-calculator": [Eye, Percent, Lock, Wallet, Users],
};

/** Marks what kind of page a link points at (a tool vs a comparison vs a case study). */
const groupIcons: Record<MarketingPageGroup, LucideIcon> = {
  features: Layers,
  "use-cases": Users,
  compare: Scale,
  "case-studies": Quote,
  tools: Wrench,
  company: Building2,
};

const groupHighlightFallback: Record<MarketingPageGroup, LucideIcon> = {
  features: Layers,
  "use-cases": Users,
  compare: Scale,
  "case-studies": Quote,
  tools: Wrench,
  company: Building2,
};

export const evidenceIcon: LucideIcon = ShieldCheck;
export const methodologyIcon: LucideIcon = FileText;
export const relatedGuideIcon: LucideIcon = BookOpen;

export function getMarketingGroupIcon(group: MarketingPageGroup): LucideIcon {
  return groupIcons[group];
}

/**
 * Icon for the highlight at `index`. Falls back to the group icon so a page
 * that gains a highlight before its icon is curated still renders correctly.
 */
export function getMarketingHighlightIcon(
  pageId: string,
  group: MarketingPageGroup,
  index: number,
): LucideIcon {
  return highlightIcons[pageId]?.[index] ?? groupHighlightFallback[group];
}
