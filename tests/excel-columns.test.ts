import assert from 'node:assert/strict';
import test from 'node:test';

import {
  excelColumnIndexToLabel,
  excelColumnLabelToIndex,
  MAX_EXCEL_COLUMN_INDEX,
} from '../src/lib/excel-columns';

test('Excel column labels convert to and from zero-based indexes', () => {
  const columns = [
    { label: 'A', index: 0 },
    { label: 'Z', index: 25 },
    { label: 'AA', index: 26 },
    { label: 'AG', index: 32 },
    { label: 'XFD', index: MAX_EXCEL_COLUMN_INDEX },
  ];

  for (const column of columns) {
    assert.equal(excelColumnLabelToIndex(column.label), column.index);
    assert.equal(excelColumnLabelToIndex(column.label.toLowerCase()), column.index);
    assert.equal(excelColumnIndexToLabel(column.index), column.label);
  }
});

test('invalid or out-of-range Excel columns are rejected', () => {
  for (const label of ['', '1', 'A1', 'AAAA', 'XFE']) {
    assert.equal(excelColumnLabelToIndex(label), null);
  }

  assert.equal(excelColumnIndexToLabel(-1), '');
  assert.equal(excelColumnIndexToLabel(MAX_EXCEL_COLUMN_INDEX + 1), '');
  assert.equal(excelColumnIndexToLabel(1.5), '');
});
