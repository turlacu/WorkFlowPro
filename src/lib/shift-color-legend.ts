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

export function hasUnconfiguredShiftTime(legend: unknown): boolean {
  return Boolean(
    legend
    && typeof legend === 'object'
    && 'startTime' in legend
    && 'endTime' in legend
    && legend.startTime === '00:00'
    && legend.endTime === '00:00',
  );
}

export function shouldHideFromMainSchedule(legend: unknown): boolean {
  return isVacationLegend(legend) || hasUnconfiguredShiftTime(legend);
}
