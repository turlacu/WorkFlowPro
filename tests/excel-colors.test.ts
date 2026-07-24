import assert from 'node:assert/strict';
import test from 'node:test';

import { extractExcelFillColor } from '../src/lib/excel-colors';

test('Excel fill colors are extracted from XLSX and legacy XLS style shapes', () => {
  assert.equal(
    extractExcelFillColor({
      s: { patternType: 'solid', fgColor: { rgb: 'FF0000' }, bgColor: { indexed: 64 } },
    }),
    '#FF0000',
  );
  assert.equal(
    extractExcelFillColor({
      s: { fill: { patternType: 'solid', fgColor: { rgb: 'FF92D050' } } },
    }),
    '#92D050',
  );
  assert.equal(
    extractExcelFillColor({
      s: { patternType: 'solid', fgColor: { indexed: 5 } },
    }),
    '#FFFF00',
  );
});

test('default, absent, and white Excel fills are not treated as shifts', () => {
  assert.equal(extractExcelFillColor(undefined), undefined);
  assert.equal(extractExcelFillColor({ s: { patternType: 'none' } }), undefined);
  assert.equal(
    extractExcelFillColor({
      s: { patternType: 'solid', fgColor: { theme: 0 }, bgColor: { indexed: 64 } },
    }),
    undefined,
  );
  assert.equal(
    extractExcelFillColor({
      s: { patternType: 'solid', fgColor: { rgb: 'FFFFFF' }, bgColor: { indexed: 64 } },
    }),
    undefined,
  );
});
