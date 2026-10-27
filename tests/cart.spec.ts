import { expect, test } from '@playwright/test';
import { INVALID_COUPON, PRODUCTS } from './data/products';
import {
  addProductToCart,
  appliedDiscount,
  applyCoupon,
  continueShopping,
  couponFailure,
  expectLine,
  expectRowCount,
  expectSubtotal,
  openCart,
  openCartFromHeader,
  removeProduct,
  rowFor,
  tag,
  updateQuantity,
} from './helpers/cart';

const { htc, leica } = PRODUCTS;

// Every test uses Playwright's default `page` fixture = a fresh browser context,
// i.e. a new logged-out guest session with an empty cart. Tests share no state.
// Expected amounts are computed from unit prices read on the product page BEFORE adding.

test.describe('US 001 Manage a guest shopping cart', () => {
  test('TC-001 | AC01 | Add one product to an empty cart', async ({ page }) => {
    tag('TC-001', 'AC01');
    const htcUnit = await addProductToCart(page, htc, 1);

    await openCart(page);
    await expectRowCount(page, 1);
    await expectLine(page, htc, { qty: 1, unitCents: htcUnit });
    await expectSubtotal(page, htcUnit * 1);
  });

  test('TC-004 | AC02 | Add a second distinct product keeps two separate rows', async ({ page }) => {
    tag('TC-004', 'AC02');
    const htcUnit = await addProductToCart(page, htc, 1);
    const leicaUnit = await addProductToCart(page, leica, 1);

    await openCart(page);
    await expectRowCount(page, 2);
    await expectLine(page, htc, { qty: 1, unitCents: htcUnit }); // first product unchanged
    await expectLine(page, leica, { qty: 1, unitCents: leicaUnit });
    await expectSubtotal(page, htcUnit + leicaUnit);
  });

  test('TC-007 | AC03 | Adding the same product again increases the existing row', async ({ page }) => {
    tag('TC-007', 'AC03');
    const htcUnit = await addProductToCart(page, htc, 1);
    await addProductToCart(page, htc, 2); // added quantity = 2, so expected total = 1 + 2

    await openCart(page);
    await expectRowCount(page, 1); // no duplicate row
    await expectLine(page, htc, { qty: 3, unitCents: htcUnit });
    await expectSubtotal(page, htcUnit * 3);
  });

  test('TC-010 | AC04 | Update quantity 1 -> 3 recalculates totals, other row unchanged', async ({ page }) => {
    tag('TC-010', 'AC04');
    const htcUnit = await addProductToCart(page, htc, 1);
    const leicaUnit = await addProductToCart(page, leica, 1);

    await openCart(page);
    await updateQuantity(page, htc, 3);

    await expectLine(page, htc, { qty: 3, unitCents: htcUnit });
    await expectLine(page, leica, { qty: 1, unitCents: leicaUnit }); // untouched
    await expectSubtotal(page, htcUnit * 3 + leicaUnit);
  });

  test('TC-014 | AC05 | Remove one of two products recalculates the subtotal', async ({ page }) => {
    tag('TC-014', 'AC05');
    await addProductToCart(page, htc, 1);
    const leicaUnit = await addProductToCart(page, leica, 1);

    await openCart(page);
    await removeProduct(page, htc);

    await expect(rowFor(page, htc)).toHaveCount(0);
    await expectRowCount(page, 1);
    await expectLine(page, leica, { qty: 1, unitCents: leicaUnit });
    await expectSubtotal(page, leicaUnit);
  });

  test('TC-017 | AC06 | Continue shopping then reopen cart keeps items and quantities', async ({ page }) => {
    tag('TC-017', 'AC06');
    const htcUnit = await addProductToCart(page, htc, 2);
    const leicaUnit = await addProductToCart(page, leica, 1);

    await openCart(page);
    await continueShopping(page);
    await openCartFromHeader(page);

    await expectRowCount(page, 2);
    await expectLine(page, htc, { qty: 2, unitCents: htcUnit });
    await expectLine(page, leica, { qty: 1, unitCents: leicaUnit });
    await expectSubtotal(page, htcUnit * 2 + leicaUnit);
  });

  test('TC-019 | AC06 | Cart is preserved after page refresh', async ({ page }) => {
    tag('TC-019', 'AC06');
    const htcUnit = await addProductToCart(page, htc, 1);
    const leicaUnit = await addProductToCart(page, leica, 2);

    await openCart(page);
    await page.reload();

    await expectRowCount(page, 2);
    await expectLine(page, htc, { qty: 1, unitCents: htcUnit });
    await expectLine(page, leica, { qty: 2, unitCents: leicaUnit });
    await expectSubtotal(page, htcUnit + leicaUnit * 2);
  });

  test('TC-021 | No AC (in scope: invalid discount) | Invalid discount code is rejected', async ({ page }) => {
    tag('TC-021', 'No AC - in-scope invalid discount');
    const htcUnit = await addProductToCart(page, htc, 1);

    await openCart(page);
    await applyCoupon(page, INVALID_COUPON);

    await expect(couponFailure(page)).toBeVisible();
    await expect(couponFailure(page)).toContainText(/coupon/i);
    await expect(appliedDiscount(page)).toHaveCount(0); // nothing applied
    await expectRowCount(page, 1);
    await expectLine(page, htc, { qty: 1, unitCents: htcUnit });
    await expectSubtotal(page, htcUnit); // subtotal unchanged
  });
});
