import { parseISO } from 'date-fns';

export const zonedTimeToUtc = (input: string): string | undefined => {
  if (!input) {
    return undefined;
  }
  try {
    const parsed = parseISO(input);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  } catch (error) {
    // ignore
  }
  const fallback = new Date(input);
  return Number.isNaN(fallback.getTime()) ? undefined : fallback.toISOString();
};

export const todayIso = (): string => {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())).toISOString();
};
