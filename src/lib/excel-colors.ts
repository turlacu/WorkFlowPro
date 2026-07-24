const INDEXED_EXCEL_COLORS = [
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '000000', 'FFFFFF', 'FF0000', '00FF00', '0000FF', 'FFFF00', 'FF00FF', '00FFFF',
  '800000', '008000', '000080', '808000', '800080', '008080', 'C0C0C0', '808080',
  '9999FF', '993366', 'FFFFCC', 'CCFFFF', '660066', 'FF8080', '0066CC', 'CCCCFF',
  '000080', 'FF00FF', 'FFFF00', '00FFFF', '800080', '800000', '008080', '0000FF',
  '00CCFF', 'CCFFFF', 'CCFFCC', 'FFFF99', '99CCFF', 'FF99CC', 'CC99FF', 'FFCC99',
  '3366FF', '33CCCC', '99CC00', 'FFCC00', 'FF9900', 'FF6600', '666699', '969696',
  '003366', '339966', '003300', '333300', '993300', '993366', '333399', '333333',
] as const;

interface ExcelColor {
  rgb?: unknown;
  indexed?: unknown;
}

interface ExcelStyle {
  patternType?: unknown;
  fgColor?: ExcelColor;
  bgColor?: ExcelColor;
  fill?: {
    patternType?: unknown;
    fgColor?: ExcelColor;
    bgColor?: ExcelColor;
    patternFill?: {
      fgColor?: ExcelColor;
      bgColor?: ExcelColor;
    };
  };
}

function resolveColor(color: ExcelColor | undefined): string | undefined {
  if (!color) return undefined;

  if (typeof color.rgb === 'string') {
    const rgb = color.rgb.replace(/^#/, '').slice(-6).toUpperCase();
    if (/^[0-9A-F]{6}$/.test(rgb)) {
      return `#${rgb}`;
    }
  }

  if (typeof color.indexed === 'number') {
    const rgb = INDEXED_EXCEL_COLORS[color.indexed];
    return rgb ? `#${rgb}` : undefined;
  }

  return undefined;
}

export function extractExcelFillColor(cell: unknown): string | undefined {
  const style = (cell as { s?: ExcelStyle } | null | undefined)?.s;
  if (!style) return undefined;

  const patternType = style.fill?.patternType ?? style.patternType;
  if (patternType === 'none') return undefined;

  const candidates = [
    style.fill?.fgColor,
    style.fill?.patternFill?.fgColor,
    style.fgColor,
    style.fill?.bgColor,
    style.fill?.patternFill?.bgColor,
    style.bgColor,
  ];

  for (const candidate of candidates) {
    const color = resolveColor(candidate);
    // White and automatic backgrounds represent an unassigned day in supported schedules.
    if (color && color !== '#FFFFFF') {
      return color;
    }
  }

  return undefined;
}
