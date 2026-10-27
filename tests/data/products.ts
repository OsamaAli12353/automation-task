// Test data. Reference prices are from the assignment (USD). Tests READ the live price
// from the product detail page before acting; reference values are only used to flag price drift.

export interface Product {
  name: string;
  referenceCents: number; // USD, in cents to avoid floating point errors
}

export const PRODUCTS = {
  htc: { name: 'HTC smartphone', referenceCents: 24500 } as Product,
  leica: { name: 'Leica T Mirrorless Digital Camera', referenceCents: 53000 } as Product,
};

export const INVALID_COUPON = 'QCINVALID2026';
export const CURRENCY_SYMBOL = '$';
