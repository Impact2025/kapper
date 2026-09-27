import { z } from "zod";

/**
 * Newsletter content model: an ordered list of blocks, stored as JSON on the
 * campaign and rendered to email HTML by lib/newsletter/render.ts. Pure — used
 * by the client editor, the server renderer and the tests alike.
 */

const url = z.string().trim().max(2000).refine((v) => /^https?:\/\//.test(v) || v.startsWith("/"), "Gebruik een volledige link (https://…) of een pad (/…).");

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id: z.string(), type: z.literal("heading"), text: z.string().max(300), level: z.union([z.literal(1), z.literal(2)]).default(2) }),
  z.object({ id: z.string(), type: z.literal("text"), markdown: z.string().max(20_000) }),
  z.object({
    id: z.string(),
    type: z.literal("button"),
    label: z.string().max(80),
    url,
    align: z.enum(["left", "center"]).default("left"),
  }),
  z.object({ id: z.string(), type: z.literal("image"), src: url, alt: z.string().max(300), href: url.optional().or(z.literal("")) }),
  z.object({
    id: z.string(),
    type: z.literal("post"),
    title: z.string().max(300),
    excerpt: z.string().max(1000).default(""),
    url,
    image: url.optional().or(z.literal("")),
  }),
  z.object({ id: z.string(), type: z.literal("divider") }),
  z.object({ id: z.string(), type: z.literal("spacer"), size: z.enum(["s", "m", "l"]).default("m") }),
]);

export type NewsletterBlock = z.infer<typeof blockSchema>;
export type BlockType = NewsletterBlock["type"];

export const blocksSchema = z.array(blockSchema).max(80);

/** Parse stored JSON leniently: invalid blocks are dropped rather than crashing a render. */
export function parseBlocks(raw: unknown): NewsletterBlock[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((b) => {
    const parsed = blockSchema.safeParse(b);
    return parsed.success ? [parsed.data] : [];
  });
}

export const BLOCK_LABELS: Record<BlockType, { label: string; icon: string }> = {
  heading: { label: "Kop", icon: "title" },
  text: { label: "Tekst", icon: "notes" },
  button: { label: "Knop", icon: "smart_button" },
  image: { label: "Afbeelding", icon: "image" },
  post: { label: "Blogartikel", icon: "article" },
  divider: { label: "Scheidingslijn", icon: "horizontal_rule" },
  spacer: { label: "Witruimte", icon: "height" },
};

export function newBlockId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyBlock(type: BlockType, id = newBlockId()): NewsletterBlock {
  switch (type) {
    case "heading":
      return { id, type, text: "Nieuwe kop", level: 2 };
    case "text":
      return { id, type, markdown: "Hoi {{voornaam|daar}},\n\nSchrijf hier je tekst." };
    case "button":
      return { id, type, label: "Lees meer", url: "https://", align: "left" };
    case "image":
      return { id, type, src: "https://", alt: "", href: "" };
    case "post":
      return { id, type, title: "", excerpt: "", url: "/blog/", image: "" };
    case "divider":
      return { id, type };
    case "spacer":
      return { id, type, size: "m" };
  }
}

/** A sensible starting layout for a new campaign. */
export function starterBlocks(): NewsletterBlock[] {
  return [
    { id: newBlockId(), type: "heading", text: "Nieuws van deze maand", level: 1 },
    { id: newBlockId(), type: "text", markdown: "Hoi {{voornaam|daar}},\n\nKort en krachtig: wat is er nieuw en wat heb je eraan?" },
    { id: newBlockId(), type: "button", label: "Bekijk wat er nieuw is", url: "https://", align: "left" },
  ];
}
