import path from 'node:path';

export function resolveWithin(root: string, segments: readonly string[]): string | null {
  if (segments.length === 0 || segments.some((segment) => !segment || segment === '.' || segment === '..')) {
    return null;
  }

  const resolvedRoot = path.resolve(root);
  const candidate = path.resolve(resolvedRoot, ...segments);
  if (candidate !== resolvedRoot && !candidate.startsWith(`${resolvedRoot}${path.sep}`)) {
    return null;
  }

  return candidate;
}

export function safeDownloadName(value: string): string {
  return path.basename(value).replace(/[\r\n"\\]/g, '_');
}
