interface ExcelDayCell {
  v?: unknown;
  w?: string;
  t?: string;
  z?: string;
}

function dayFromText(value: string): number | null {
  const text = value.trim();
  if (!text) return null;

  if (/^\d{1,2}$/.test(text)) {
    const day = Number(text);
    return day >= 1 && day <= 31 ? day : null;
  }

  const dayFirst = /^(\d{1,2})[./-]\d{1,2}(?:[./-]\d{2,4})?$/.exec(text);
  if (dayFirst) {
    const day = Number(dayFirst[1]);
    return day >= 1 && day <= 31 ? day : null;
  }

  return null;
}

function dayFromExcelSerial(serial: number): number | null {
  if (!Number.isFinite(serial) || serial <= 31) return null;
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + Math.floor(serial) * 86_400_000);
  return Number.isNaN(date.getTime()) ? null : date.getUTCDate();
}

export function parseExcelScheduleDay(cell: ExcelDayCell | null | undefined): number | null {
  if (!cell) return null;

  if (cell.v instanceof Date && !Number.isNaN(cell.v.getTime())) {
    return cell.v.getUTCDate();
  }

  if (typeof cell.v === 'number') {
    if (Number.isInteger(cell.v) && cell.v >= 1 && cell.v <= 31) return cell.v;

    const hasDateFormat =
      cell.t === 'd'
      || (typeof cell.z === 'string' && /[dmy]/i.test(cell.z));
    if (hasDateFormat) return dayFromExcelSerial(cell.v);
  }

  if (typeof cell.v === 'string') {
    const day = dayFromText(cell.v);
    if (day !== null) return day;
  }

  return typeof cell.w === 'string' ? dayFromText(cell.w) : null;
}
