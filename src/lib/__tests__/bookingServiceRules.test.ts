import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canContinueBooking,
  composeBookingServiceIds,
  requiresBlowDry,
  requiresShampooCompanion,
} from '../bookingServiceRules';
import type { CustomerService } from '../../types/customerApi';

function svc(
  partial: Partial<CustomerService> & Pick<CustomerService, 'id' | 'name'>,
): CustomerService {
  return {
    category_id: null,
    category_name: null,
    duration: 30,
    price: 10,
    need_processing: false,
    ...partial,
  };
}

const shampoo = svc({
  id: 62,
  name: 'Shampoo',
  category_name: 'lavaggio',
  duration: 10,
  price: 3,
  selectable: false,
});
const piega = svc({ id: 58, name: 'Piega', category_name: 'styling', duration: 45, price: 22 });
const erbe = svc({
  id: 66,
  name: 'Erbe Botaniche',
  category_name: 'erbe',
  duration: 80,
  need_processing: true,
  price: 70,
});
const colore = svc({
  id: 64,
  name: 'Colore Ossidazione',
  category_name: 'colore',
  duration: 65,
  need_processing: true,
  price: 50,
});
const taglio = svc({
  id: 55,
  name: 'Taglio Donna Scaramuzzo',
  category_name: 'taglio',
  duration: 50,
  price: 73,
});
const taglioUomo = svc({
  id: 54,
  name: 'Taglio Uomo Scaramuzzo',
  category_name: 'taglio',
  duration: 35,
  price: 50,
});
const catalog = [shampoo, piega, erbe, colore, taglio, taglioUomo];

describe('composeBookingServiceIds', () => {
  it('erbe → shampoo + erbe + piega', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [66]), [62, 66, 58]);
  });

  it('colore → shampoo + colore + piega', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [64]), [62, 64, 58]);
  });

  it('taglio donna → shampoo + taglio + piega', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [55]), [62, 55, 58]);
  });

  it('taglio uomo → invariato', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [54]), [54]);
  });

  it('servizio semplice shampoo → invariato', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [62]), [62]);
  });

  it('aggiunta manuale shampoo/piega → non duplica e ordina', () => {
    assert.deepEqual(composeBookingServiceIds(catalog, [66, 58, 62]), [62, 66, 58]);
    assert.deepEqual(composeBookingServiceIds(catalog, [62, 66]), [62, 66, 58]);
  });

  it('canContinue dopo composizione', () => {
    assert.equal(canContinueBooking(catalog, composeBookingServiceIds(catalog, [66])), true);
    assert.equal(canContinueBooking(catalog, [66]), false);
  });

  it('requiresShampooCompanion / requiresBlowDry', () => {
    assert.equal(requiresShampooCompanion(erbe), true);
    assert.equal(requiresShampooCompanion(colore), true);
    assert.equal(requiresShampooCompanion(taglio), true);
    assert.equal(requiresShampooCompanion(taglioUomo), false);
    assert.equal(requiresBlowDry(erbe), true);
    assert.equal(requiresBlowDry(taglioUomo), false);
  });
});
