import { z } from "zod";

export const DEFAULT_MODEL = "mistral-small-latest";

function isoDateRefine(val: string): boolean {
  const parsed = new Date(val);
  if (isNaN(parsed.getTime())) return false;
  const [year, month, day] = val.split("-").map(Number);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

export const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(72)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  newPassword: z.string().min(8).max(72)
});

export const diarySchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/),
  moodLevel: z.number().min(1).max(9).nullable().optional(),
  depressionLevel: z.number().min(1).max(9).nullable().optional(),
  anxietyLevel: z.number().min(1).max(9).nullable().optional(),
  positiveMoods: z.string().max(2000).optional().default(""),
  negativeMoods: z.string().max(2000).optional().default(""),
  generalMoods: z.string().max(2000).optional().default(""),
  description: z.string().max(10000).optional().default(""),
  gratitude: z.string().max(10000).optional().default(""),
  reflection: z.string().max(10000).optional()
});

export const painValueSchema = z.union([z.string(), z.array(z.string())]).optional();

export const painSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/),
  painLevel: z.number().int().min(1).max(9).nullable().optional(),
  fatigueLevel: z.number().int().min(1).max(9).nullable().optional(),
  coffeeCount: z.number().int().min(0).max(50).nullable().optional(),
  area: painValueSchema,
  symptoms: painValueSchema,
  activities: painValueSchema,
  medicines: painValueSchema,
  habits: painValueSchema,
  other: painValueSchema,
  note: z.string().max(2000).optional().default(""),
  tags: z
    .object({
      area: z.array(z.string()).optional(),
      symptoms: z.array(z.string()).optional(),
      activities: z.array(z.string()).optional(),
      medicines: z.array(z.string()).optional(),
      habits: z.array(z.string()).optional(),
      other: z.array(z.string()).optional()
    })
    .partial()
    .optional()
});

export const cbtSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/),
  situation: z.string().max(5000).optional().default(""),
  thoughts: z.string().max(5000).optional().default(""),
  helpfulReasoning: z.string().max(5000).optional().default(""),
  mainUnhelpfulThought: z.string().max(5000).optional().default(""),
  effectOfBelieving: z.string().max(5000).optional().default(""),
  evidenceForAgainst: z.string().max(5000).optional().default(""),
  alternativeExplanation: z.string().max(5000).optional().default(""),
  worstBestScenario: z.string().max(5000).optional().default(""),
  friendAdvice: z.string().max(5000).optional().default(""),
  productiveResponse: z.string().max(5000).optional().default(""),
});

export const dbtSchema = z.object({
  entryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entryTime: z.string().regex(/^\d{2}:\d{2}$/),
  emotionName: z.string().max(200).optional().default(""),
  allowAffirmation: z.string().max(5000).optional().default(""),
  watchEmotion: z.string().max(5000).optional().default(""),
  bodyLocation: z.string().max(500).optional().default(""),
  bodyFeeling: z.string().max(5000).optional().default(""),
  presentMoment: z.string().max(5000).optional().default(""),
  emotionReturns: z.string().max(5000).optional().default(""),
});

export const prefsSchema = z.object({
  model: z.string().max(200).default(DEFAULT_MODEL),
  chatRange: z.string().max(50).default("all"),
  lastRange: z.string().max(50).default("all"),
  graphSelection: z.record(z.string(), z.unknown()).default({}),
  birthday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isoDateRefine, {
    message: "Invalid birthday: must be a valid calendar date in YYYY-MM-DD format"
  }).nullable().optional().default(null),
});

export const memorableRepeatModeSchema = z.enum(["one-time", "monthly", "yearly"]);

export const memorableDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(isoDateRefine, {
    message: "Invalid date: must be a valid calendar date in YYYY-MM-DD format"
  }),
  title: z.string().trim().min(1).max(120),
  emoji: z.string().trim().max(16).optional().default(""),
  description: z.string().max(1000).optional().default(""),
  repeatMode: memorableRepeatModeSchema,
});

export const mcpTokenCreateSchema = z.object({
  label: z.string().min(0).max(100).optional().default(""),
  // expiresAt is either an ISO timestamp string or null (= never expires).
  // Frontend computes the absolute timestamp client-side from the chosen
  // duration ("30d", "90d", "1y", "never") so the server stays simple.
  expiresAt: z.string().datetime().nullable().optional().default(null).refine(
    (val) => {
      if (!val) return true;
      const ts = new Date(val).getTime();
      if (ts < Date.now()) return false;
      const max = new Date();
      max.setFullYear(max.getFullYear() + 1);
      return ts <= max.getTime();
    },
    { message: "Expiry must be in the future and within 1 year from now" }
  ),
});

const BACKUP_MAX_ROWS = 50_000;

export const backupImportSchema = z.object({
  diary: z
    .object({ rows: z.array(z.record(z.string(), z.unknown())).max(BACKUP_MAX_ROWS).default([]) })
    .optional(),
  pain: z
    .object({
      rows: z.array(z.record(z.string(), z.unknown())).max(BACKUP_MAX_ROWS).default([]),
      options: z
        .object({
          options: z.record(z.string(), z.array(z.string())).optional(),
          removed: z.record(z.string(), z.array(z.string())).optional(),
          preselectedMedicines: z.array(z.string()).optional()
        })
        .optional()
    })
    .optional(),
  prefs: prefsSchema.optional()
});

export const optionFieldSchema = z.object({
  field: z.string(),
  value: z.string().min(1)
});

export const optionPreselectSchema = z.object({
  field: z.string(),
  value: z.string().min(1),
  preselected: z.boolean()
});
