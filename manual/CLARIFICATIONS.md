# Clarification questions

1. AC04 says "the available cart update control". Is clicking an "Update shopping cart" button the intended control, or should changes save automatically?
2. What should happen when a cart quantity is set to 0, negative, decimal, or non-numeric? (TC-013, TC-024 are Exploratory because the story does not define it.)
3. Is there a maximum quantity per line, and what message is expected at the limit? (TC-026)
4. What exact error text is expected for an invalid discount code? (TC-021 only asserts that a coupon-related error appears and nothing is discounted.)
5. Should the cart subtotal ever include discounts, tax, or shipping? We assume Sub-Total only.
6. "Same options": the two products have no required options on the demo; is any product with attributes expected in scope?
7. The demo store is shared and may reset data/prices. Is a price drift from the reference prices a defect or only a test-data update?
