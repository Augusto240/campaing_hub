import { z, ZodSchema } from 'zod';
import { AppError } from './error-handler';

const formatIssues = (issues: z.ZodIssue[]) => {
  return issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'body';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
};

export const validate = <T>(schema: ZodSchema<T>, input: unknown): T => {
  const parsed = schema.safeParse(input);

  if (!parsed.success) {
    const details = formatIssues(parsed.error.issues);
    throw new AppError(400, `Validation error - ${details}`, true, 'VALIDATION_ERROR');
  }

  return parsed.data;
};

export const uuidSchema = z.string().uuid();
