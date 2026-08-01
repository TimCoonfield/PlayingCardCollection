import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { ALL_TAGS } from "./schemas";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const deckIdentificationSchema = z.object({
  name: z.string().nullable(),
  series: z.string().nullable(),
  designer: z.string().nullable(),
  producer: z.string().nullable(),
  tags: z.array(z.enum(ALL_TAGS)),
  deckNumber: z.number().int().nullable(),
  productionRun: z.number().int().nullable(),
  notes: z.string().nullable(),
});

export type DeckIdentification = z.infer<typeof deckIdentificationSchema>;

const PROMPT = `You are helping catalog a physical playing card collection. Look at the photo(s) of a playing card deck (usually the tuck box / packaging) and identify it.

Return your best guess for each field. If you cannot confidently determine a field, return null for it (or an empty array for tags) rather than guessing randomly.

- name: The specific deck name as printed on the box (e.g. "Smoke and Mirrors V9", not just the brand).
- series: The broader series/collection this deck belongs to, if the box indicates one (often distinct from the deck name).
- designer: The card designer/artist credited, if shown.
- producer: The publisher/printer/company that produced the deck (e.g. "Art of Play", "USPCC", "Theory11").
- tags: Any of these that clearly apply, based on visual cues: ${ALL_TAGS.join(", ")}.
- deckNumber: If the box shows a limited-edition number like "391/700" or "#391", the first number (391).
- productionRun: If the box shows a limited-edition run like "391/700", the second number (700).
- notes: Any other useful identifying detail visible (e.g. "Kickstarter exclusive", special foil, edition name), or null.`;

export async function identifyDeck(imageUrls: string[]): Promise<DeckIdentification> {
  const message = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          ...imageUrls.map((url) => ({
            type: "image" as const,
            source: { type: "url" as const, url },
          })),
          { type: "text" as const, text: PROMPT },
        ],
      },
    ],
    output_config: {
      format: zodOutputFormat(deckIdentificationSchema),
    },
  });

  if (!message.parsed_output) {
    throw new Error("Claude did not return a parseable identification.");
  }

  return message.parsed_output;
}
