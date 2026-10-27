import { expect, Locator, Page, test } from '@playwright/test';
import type { Product } from '../data/products';
import { CURRENCY_SYMBOL } from '../data/products';
import { formatMoney, parseMoney } from './money';

// All selectors in one place; nopCommerce markup can vary between demo versions.
const SEL = {
  detailPrice: '.product-essential .product-price',
  detailQty: '.product-essential input.qty-input',
  addedNotification: '#bar-notification .success',
  cartRows: 'table.cart tbody tr',
  rowQty: 'input.qty-input',
  rowUnitPrice: '.product-unit-price',
  rowLineTotal: '.product-subtotal',
  rowRemoveButton: 'button.remove-btn',
  rowRemoveCheckbox: 'input[name="removefromcart"]',
  cartSubtotal: '.cart-total .order-subtotal .value-summary',
  couponInput: 'input[name="discountcouponcode"]',
  couponApply: 'button[name="applydiscountcouponcode"]',
  couponFailure: '.message-failure:not(:empty)',
  appliedDiscount: '.order-discount, .discount-total, .current-code',
  headerCartLink: '.header-links a.ico-cart',
};

/** Tag a test with its manual case id and acceptance criterion (shows in the HTML report). */
export function tag(caseId: string, ac: string): void {
  test.info().annotations.push({ type: 'manual-case', description: caseId });
  test.info().annotations.push({ type: 'acceptance-criterion', description: ac });
}

export async function openProduct(page: Page, product: Product): Promise<void> {
  await page.goto(`/search?q=${encodeURIComponent(product.name)}`);
  await page.locator('.product-title a').filter({ hasText: product.name }).first().click();
  await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
}

/**
 * Adds `qty` units from the product DETAIL page, setting the quantity explicitly.
 * Returns the unit price (cents) read from the page BEFORE the add action.
 */
export async function addProductToCart(page: Page, product: Product, qty: number): Promise<number> {
  await openProduct(page, product);

  const price = page.locator(SEL.detailPrice).first();
  await expect(price).toContainText(CURRENCY_SYMBOL); // same currency (USD) throughout
  const unitCents = parseMoney(await price.innerText());
  if (unitCents !== product.referenceCents) {
    test.info().annotations.push({
      type: 'price-drift',
      description: `${product.name}: live ${formatMoney(unitCents)} vs reference ${formatMoney(product.referenceCents)}`,
    });
  }

  await page.locator(SEL.detailQty).fill(String(qty));
  await page
    .locator('.product-essential')
    .getByRole('button', { name: 'Add to cart', exact: true })
    .click();
  await expect(page.locator(SEL.addedNotification)).toBeVisible();
  return unitCents;
}

export async function openCart(page: Page): Promise<void> {
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Shopping cart' })).toBeVisible();
}

export async function openCartFromHeader(page: Page): Promise<void> {
  await page.locator(SEL.headerCartLink).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByRole('heading', { name: 'Shopping cart' })).toBeVisible();
}

export function rowFor(page: Page, product: Product): Locator {
  return page
    .locator(SEL.cartRows)
    .filter({ has: page.getByRole('link', { name: product.name, exact: true }) });
}

export async function expectRowCount(page: Page, count: number): Promise<void> {
  await expect(page.locator(SEL.cartRows)).toHaveCount(count);
}

/** Asserts name (exactly one row), unit price, quantity and line total of a cart row. */
export async function expectLine(
  page: Page,
  product: Product,
  expected: { qty: number; unitCents: number },
): Promise<void> {
  const row = rowFor(page, product);
  await expect(row).toHaveCount(1);
  await expect(row.locator(SEL.rowUnitPrice)).toHaveText(formatMoney(expected.unitCents));
  await expect(row.locator(SEL.rowQty)).toHaveValue(String(expected.qty));
  await expect(row.locator(SEL.rowLineTotal)).toHaveText(formatMoney(expected.unitCents * expected.qty));
}

export async function expectSubtotal(page: Page, cents: number): Promise<void> {
  await expect(page.locator(SEL.cartSubtotal)).toHaveText(formatMoney(cents));
}

export async function updateQuantity(page: Page, product: Product, qty: number): Promise<void> {
  const quantity = rowFor(page, product).locator(SEL.rowQty);
  await quantity.fill(String(qty));

  const updateButton = page.getByRole('button', { name: 'Update shopping cart' }).last();
  if (await updateButton.isVisible()) {
    await updateButton.click();
  } else {
    await quantity.press('Tab');
  }
}

export async function removeProduct(page: Page, product: Product): Promise<void> {
  const row = rowFor(page, product);
  if ((await row.locator(SEL.rowRemoveButton).count()) > 0) {
    await row.locator(SEL.rowRemoveButton).click(); // newer nopCommerce: remove button
  } else {
    await row.locator(SEL.rowRemoveCheckbox).check(); // older: checkbox + update
    await page.getByRole('button', { name: 'Update shopping cart' }).click();
  }
}

export async function continueShopping(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continue shopping' }).click();
  await expect(page).not.toHaveURL(/\/cart/);
}

export async function applyCoupon(page: Page, code: string): Promise<void> {
  await page.locator(SEL.couponInput).fill(code);
  await page.locator(SEL.couponApply).click();
}

export function couponFailure(page: Page): Locator {
  return page.locator(SEL.couponFailure);
}

export function appliedDiscount(page: Page): Locator {
  return page.locator(SEL.appliedDiscount);
}
