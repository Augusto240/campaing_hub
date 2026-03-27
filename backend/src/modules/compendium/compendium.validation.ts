import { z } from 'zod';

export const campaignCompendiumParamsSchema = z.object({
  campaignId: z.string().uuid(),
});

export const systemCompendiumParamsSchema = z.object({
  systemSlug: z.string().trim().min(2).max(40),
});

const rawKindSchema = z.enum(['bestiary', 'spell', 'item', 'class']);

export const compendiumQuerySchema = z.object({
  kind: rawKindSchema.optional(),
  search: z.string().trim().max(120).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional().default(60),
});

export type CompendiumKindQuery = z.infer<typeof rawKindSchema>;

export const toCompendiumKind = (kind: CompendiumKindQuery | undefined) => {
  if (!kind) {
    return undefined;
  }

  if (kind === 'bestiary') {
    return 'BESTIARY' as const;
  }

  if (kind === 'spell') {
    return 'SPELL' as const;
  }

  if (kind === 'item') {
    return 'ITEM' as const;
  }

  return 'CLASS' as const;
};
