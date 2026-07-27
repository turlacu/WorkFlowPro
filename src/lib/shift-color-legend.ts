/**
 * Vacation is an explicit legend classification. Times alone are not enough:
 * newly detected, unconfigured colors also use 00:00–00:00 as placeholders.
 */
export function isVacationLegend(legend: unknown): boolean {
  return Boolean(
    legend
    && typeof legend === 'object'
    && 'isVacation' in legend
    && legend.isVacation === true,
  );
}
