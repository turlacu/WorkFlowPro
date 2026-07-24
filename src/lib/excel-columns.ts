export const MAX_EXCEL_COLUMN_INDEX = 16_383;

export function excelColumnIndexToLabel(columnIndex: number): string {
  if (!Number.isInteger(columnIndex) || columnIndex < 0 || columnIndex > MAX_EXCEL_COLUMN_INDEX) {
    return '';
  }

  let index = columnIndex;
  let label = '';

  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }

  return label;
}

export function excelColumnLabelToIndex(columnLabel: string): number | null {
  const normalizedLabel = columnLabel.trim().toUpperCase();

  if (!/^[A-Z]{1,3}$/.test(normalizedLabel)) {
    return null;
  }

  let index = 0;
  for (const letter of normalizedLabel) {
    index = index * 26 + letter.charCodeAt(0) - 64;
  }

  const zeroBasedIndex = index - 1;
  return zeroBasedIndex <= MAX_EXCEL_COLUMN_INDEX ? zeroBasedIndex : null;
}
