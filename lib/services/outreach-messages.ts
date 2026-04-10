import OpenAI from "openai";
import { buildOutreachPrompt } from "@/lib/prompts";

let client: OpenAI | null = null;
function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!client) client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return client;
}

export interface OutreachMessage {
  step: number;
  label: string;
  subject?: string;
  body: string;
}

/** Sender's business — whoever is doing the outreach. */
export interface OutreachSender {
  name: string | null;
  description: string | null;
  persona: string | null;
  clientPersona: string | null;
  field: string | null;
  category: string | null;
  services: string | null;
  website: string | null;
  language: string | null;
}

/** Recipient — the lead being contacted. */
export interface OutreachLead {
  name: string | null;
  ownerName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  description: string | null;
  services: string[] | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  instagramHandle: string | null;
  website: string | null;
  pricingInfo: string | null;
  yearEstablished: string | null;
  amenities: string[] | null;
  aiSummary: string | null;
  operatingHours: string | null;
  teamMembers: { name: string; role?: string }[] | null;
}

function resolveLanguage(country?: string | null): {
  label: string;
  labels: { intro: string; value: string; cta: string };
} {
  const langMap: Record<
    string,
    { label: string; labels: { intro: string; value: string; cta: string } }
  > = {
    brazil: {
      label: "Portuguese (pt-BR)",
      labels: {
        intro: "Apresentação",
        value: "Proposta de valor",
        cta: "Convite",
      },
    },
    brasil: {
      label: "Portuguese (pt-BR)",
      labels: {
        intro: "Apresentação",
        value: "Proposta de valor",
        cta: "Convite",
      },
    },
    br: {
      label: "Portuguese (pt-BR)",
      labels: {
        intro: "Apresentação",
        value: "Proposta de valor",
        cta: "Convite",
      },
    },
    portugal: {
      label: "Portuguese (pt-PT)",
      labels: {
        intro: "Apresentação",
        value: "Proposta de valor",
        cta: "Convite",
      },
    },
    pt: {
      label: "Portuguese (pt-PT)",
      labels: {
        intro: "Apresentação",
        value: "Proposta de valor",
        cta: "Convite",
      },
    },
    spain: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    españa: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    es: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    mexico: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    méxico: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    argentina: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    colombia: {
      label: "Spanish",
      labels: {
        intro: "Presentación",
        value: "Propuesta de valor",
        cta: "Invitación",
      },
    },
    france: {
      label: "French",
      labels: {
        intro: "Introduction",
        value: "Proposition de valeur",
        cta: "Invitation",
      },
    },
    fr: {
      label: "French",
      labels: {
        intro: "Introduction",
        value: "Proposition de valeur",
        cta: "Invitation",
      },
    },
    germany: {
      label: "German",
      labels: {
        intro: "Vorstellung",
        value: "Wertversprechen",
        cta: "Einladung",
      },
    },
    de: {
      label: "German",
      labels: {
        intro: "Vorstellung",
        value: "Wertversprechen",
        cta: "Einladung",
      },
    },
    italy: {
      label: "Italian",
      labels: {
        intro: "Presentazione",
        value: "Proposta di valore",
        cta: "Invito",
      },
    },
    it: {
      label: "Italian",
      labels: {
        intro: "Presentazione",
        value: "Proposta di valore",
        cta: "Invito",
      },
    },
  };
  const normalized = country?.trim().toLowerCase() ?? "";
  return (
    langMap[normalized] ?? {
      label: "English",
      labels: {
        intro: "Introduction",
        value: "Value proposition",
        cta: "Call to action",
      },
    }
  );
}

function buildSenderContext(sender: OutreachSender): string {
  const parts: string[] = [];
  if (sender.name) parts.push(`Business name: ${sender.name}`);
  if (sender.description) parts.push(`What they do: ${sender.description}`);
  if (sender.field) parts.push(`Industry: ${sender.field}`);
  if (sender.category) parts.push(`Category: ${sender.category}`);
  if (sender.persona) parts.push(`Brand voice: ${sender.persona}`);
  if (sender.clientPersona) parts.push(`Ideal client: ${sender.clientPersona}`);
  if (sender.services) parts.push(`Services offered: ${sender.services}`);
  if (sender.website) parts.push(`Website: ${sender.website}`);
  return parts.join("\n");
}

function buildLeadContext(lead: OutreachLead): string {
  const parts: string[] = [];
  if (lead.name) parts.push(`Business name: ${lead.name}`);
  if (lead.ownerName) parts.push(`Owner/founder name: ${lead.ownerName}`);
  if (lead.city) parts.push(`City: ${lead.city}`);
  if (lead.state) parts.push(`State: ${lead.state}`);
  if (lead.country) parts.push(`Country: ${lead.country}`);
  if (lead.description) parts.push(`Description: ${lead.description}`);
  if (lead.services && lead.services.length > 0)
    parts.push(`Services: ${lead.services.join(", ")}`);
  if (lead.googleRating) {
    parts.push(
      `Google rating: ${lead.googleRating}${
        lead.googleReviewCount ? ` (${lead.googleReviewCount} reviews)` : ""
      }`,
    );
  }
  if (lead.instagramHandle)
    parts.push(`Instagram: @${lead.instagramHandle.replace(/^@/, "")}`);
  if (lead.website) parts.push(`Website: ${lead.website}`);
  if (lead.pricingInfo) parts.push(`Pricing: ${lead.pricingInfo}`);
  if (lead.yearEstablished)
    parts.push(`Year established: ${lead.yearEstablished}`);
  if (lead.amenities && lead.amenities.length > 0)
    parts.push(`Amenities: ${lead.amenities.join(", ")}`);
  if (lead.operatingHours)
    parts.push(`Operating hours: ${lead.operatingHours}`);
  if (lead.aiSummary) parts.push(`AI analysis: ${lead.aiSummary}`);
  if (lead.teamMembers && lead.teamMembers.length > 0) {
    parts.push(
      `Team: ${lead.teamMembers.map((m) => m.name + (m.role ? ` (${m.role})` : "")).join(", ")}`,
    );
  }
  return parts.join("\n");
}

export async function generateOutreachMessages(
  sender: OutreachSender,
  lead: OutreachLead,
): Promise<OutreachMessage[]> {
  const openai = getOpenAI();
  if (!openai) return [];

  const { label: lang, labels } = resolveLanguage(lead.country);
  const senderContext = buildSenderContext(sender);
  const leadContext = buildLeadContext(lead);
  const senderName = sender.name || "our company";

  const systemPrompt = buildOutreachPrompt({ senderName, lang, labels });

  const userPrompt = `SENDER (who is writing):\n${senderContext || "(no sender info available)"}\n\nPROSPECT (recipient):\n${leadContext || "(no prospect info available)"}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5.4",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_completion_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const data = JSON.parse(content) as { messages?: unknown };
    if (!Array.isArray(data.messages)) return [];

    return (data.messages as Array<Record<string, unknown>>)
      .filter((m) => typeof m.step === "number" && typeof m.body === "string")
      .map((m) => ({
        step: m.step as number,
        label: typeof m.label === "string" ? m.label : String(m.step),
        subject: typeof m.subject === "string" ? m.subject : undefined,
        body: m.body as string,
      }));
  } catch (err) {
    console.error("[outreach] generation failed:", err);
    return [];
  }
}
