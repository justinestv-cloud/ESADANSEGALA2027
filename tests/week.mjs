import assert from 'node:assert/strict';
import {weekBounds,safeDocumentUrl} from '../lib/gala-week.ts';
assert.deepEqual(weekBounds('2026-11-18'),{start:'2026-11-16',end:'2026-11-22'});
assert.deepEqual(weekBounds('2026-11-22'),{start:'2026-11-16',end:'2026-11-22'});
assert.deepEqual(weekBounds('2026-11-23'),{start:'2026-11-23',end:'2026-11-29'});
assert.deepEqual(weekBounds('2027-01-01'),{start:'2026-12-28',end:'2027-01-03'});
assert.equal(safeDocumentUrl('https://drive.google.com/file/d/example'),true);
for (const url of ['javascript:alert(1)','data:text/html,hello','file:///tmp/a','https://user:password@example.com','invalid']) assert.equal(safeDocumentUrl(url),false);
console.log('PASS: week boundaries, year transition, safe document links');
