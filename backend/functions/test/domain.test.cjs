const {test} = require('node:test');
const assert = require('node:assert/strict');
const {extendMonth, INTERNET_PACKAGES, IPL_AMOUNT} = require('../lib/domain');
test('official prices', () => {
  assert.equal(IPL_AMOUNT, 100000);
  assert.deepEqual(Object.values(INTERNET_PACKAGES).map(x => x.amount), [125000,180000,250000]);
});
test('early renewal extends existing expiry', () => {
  assert.equal(extendMonth(new Date('2026-11-20T17:00:00Z'), new Date('2026-10-07T03:00:00Z')).toISOString(), '2026-12-20T17:00:00.000Z');
});
test('expired subscription starts at verification', () => {
  assert.equal(extendMonth(new Date('2026-09-01T00:00:00Z'), new Date('2026-10-07T03:00:00Z')).toISOString(), '2026-11-07T03:00:00.000Z');
});
test('Jakarta month end clamps to February, leap year supported', () => {
  assert.equal(extendMonth(null, new Date('2026-01-30T17:00:00Z')).toISOString(), '2026-02-27T17:00:00.000Z');
  assert.equal(extendMonth(null, new Date('2028-01-30T17:00:00Z')).toISOString(), '2028-02-28T17:00:00.000Z');
});
