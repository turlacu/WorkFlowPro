import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('color legend uses a fixed compact table without wide standalone data columns', () => {
  const source = readFileSync('src/components/app/shift-color-legend-manager.tsx', 'utf8');

  assert.match(source, /<Table className="table-fixed">/);
  assert.match(source, />Legend<\/TableHead>/);
  assert.match(source, />Schedule<\/TableHead>/);
  assert.match(source, /hidden h-10 px-3 sm:h-10 lg:table-cell">Notes/);
  assert.doesNotMatch(source, /<TableHead>Color Name<\/TableHead>/);
  assert.doesNotMatch(source, /<TableHead>Shift Name<\/TableHead>/);
  assert.match(source, /aria-label=\{`Edit \$\{legend\.shiftName\}`\}/);
  assert.match(source, /aria-label=\{`Delete \$\{legend\.shiftName\}`\}/);
});
