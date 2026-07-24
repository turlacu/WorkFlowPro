interface ScheduleCellOptions {
  skipValues: string[];
  defaultShift?: string;
}

export interface ParsedScheduleCell {
  shiftHours?: string;
  shiftColor?: string;
}

const DAY_ABBREVIATIONS = new Set(['l', 'm', 'j', 'v', 's', 'd']);

export function parseScheduleCell(
  value: unknown,
  shiftColor: string | undefined,
  options: ScheduleCellOptions,
): ParsedScheduleCell | null {
  const hasValue = value !== undefined && value !== null && value !== '';
  const shiftHours = hasValue
    ? String(value).trim()
    : options.defaultShift?.trim() || undefined;

  if (hasValue) {
    const normalizedValue = shiftHours?.toLocaleLowerCase('ro-RO') ?? '';
    const shouldSkip =
      normalizedValue.length === 0 ||
      DAY_ABBREVIATIONS.has(normalizedValue) ||
      options.skipValues.some((skipValue) =>
        skipValue.trim().toLocaleLowerCase('ro-RO') === normalizedValue
      );

    if (shouldSkip) return null;
  }

  if (!hasValue && !shiftColor) return null;
  return { shiftHours, shiftColor };
}
