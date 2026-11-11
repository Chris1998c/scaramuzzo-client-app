import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildBookingPayloadFingerprint } from '../bookingIdempotency';

describe('buildBookingPayloadFingerprint', () => {
  it('preserves service_ids order (Manager hash is order-sensitive)', () => {
    const a = buildBookingPayloadFingerprint({
      salonId: 1,
      serviceIds: [12, 5],
      staffId: 3,
      startTime: '2099-01-01T10:00:00',
      notes: '',
    });
    const b = buildBookingPayloadFingerprint({
      salonId: 1,
      serviceIds: [5, 12],
      staffId: 3,
      startTime: '2099-01-01T10:00:00',
      notes: '',
    });
    assert.notEqual(a, b);
  });

  it('does not embed customer_id (identity comes from JWT + auth links)', () => {
    const fp = buildBookingPayloadFingerprint({
      salonId: 1,
      serviceIds: [1],
      staffId: 2,
      startTime: '2099-01-01T10:00:00',
      notes: 'x',
    });
    assert.equal(fp.includes('customer'), false);
  });
});
