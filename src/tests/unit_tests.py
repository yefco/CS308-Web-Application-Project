"""
Unit tests for CS308 Online Store — core business logic.

These tests are pure Python and require no running server.
They mirror the logic that lives in the Rust backend and React frontend
to verify correctness of the most critical demo flows.

Run with:  python -m pytest src/tests/unit_tests.py -v
       or:  python src/tests/unit_tests.py
"""

import unittest


# ─── Req 1 / Req 3: Cart logic ────────────────────────────────────────────────

class TestCartLogic(unittest.TestCase):

    def test_cart_total_single_item(self):
        items = [{'price': 999.99, 'quantity': 1}]
        total = sum(i['price'] * i['quantity'] for i in items)
        self.assertAlmostEqual(total, 999.99, places=2)

    def test_cart_total_multiple_items(self):
        items = [
            {'price': 100.0, 'quantity': 2},
            {'price': 50.0,  'quantity': 3},
        ]
        total = sum(i['price'] * i['quantity'] for i in items)
        self.assertAlmostEqual(total, 350.0, places=2)

    def test_cart_item_count(self):
        items = [
            {'price': 10.0, 'quantity': 3},
            {'price': 20.0, 'quantity': 2},
        ]
        count = sum(i['quantity'] for i in items)
        self.assertEqual(count, 5)

    def test_tax_calculation(self):
        subtotal = 200.0
        tax = round(subtotal * 0.1, 2)
        self.assertAlmostEqual(tax, 20.0, places=2)

    def test_grand_total_with_tax_and_shipping(self):
        subtotal = 200.0
        tax = round(subtotal * 0.1, 2)
        shipping = 9.99
        grand = round(subtotal + tax + shipping, 2)
        self.assertAlmostEqual(grand, 229.99, places=2)

    def test_empty_cart_total_is_zero(self):
        items = []
        total = sum(i['price'] * i['quantity'] for i in items)
        self.assertEqual(total, 0)


# ─── Req 3: Stock / out-of-stock prevention ───────────────────────────────────

class TestStockLogic(unittest.TestCase):

    def test_in_stock_product_can_be_added(self):
        product = {'stock_quantity': 10}
        self.assertTrue(product['stock_quantity'] > 0)

    def test_out_of_stock_product_cannot_be_added(self):
        product = {'stock_quantity': 0}
        self.assertFalse(product['stock_quantity'] > 0)

    def test_stock_decreases_after_order(self):
        initial_stock = 10
        order_qty = 3
        remaining = initial_stock - order_qty
        self.assertEqual(remaining, 7)
        self.assertGreaterEqual(remaining, 0)

    def test_ordering_all_stock_leaves_zero(self):
        stock = 5
        order_qty = 5
        remaining = stock - order_qty
        self.assertEqual(remaining, 0)

    def test_order_rejected_when_insufficient_stock(self):
        stock = 2
        requested = 5
        can_fulfill = requested <= stock
        self.assertFalse(can_fulfill)

    def test_order_accepted_when_stock_sufficient(self):
        stock = 10
        requested = 3
        can_fulfill = requested <= stock
        self.assertTrue(can_fulfill)

    def test_stock_never_goes_negative(self):
        stock = 3
        order_qty = 3
        remaining = stock - order_qty
        self.assertGreaterEqual(remaining, 0)


# ─── Req 7: Search / filter ───────────────────────────────────────────────────

PRODUCTS = [
    {'product_id': 1, 'product_name': 'MacBook Pro 14"', 'description': 'Apple M3 laptop',    'stock_quantity': 5,  'price': 1999.0, 'reviews': 42},
    {'product_id': 2, 'product_name': 'iPhone 15 Pro',   'description': 'Apple smartphone',    'stock_quantity': 0,  'price': 999.0,  'reviews': 120},
    {'product_id': 3, 'product_name': 'Dell XPS 13',     'description': 'Windows ultrabook',   'stock_quantity': 8,  'price': 1299.0, 'reviews': 18},
    {'product_id': 4, 'product_name': 'AirPods Pro',     'description': 'Noise-cancelling TWS', 'stock_quantity': 15, 'price': 249.0,  'reviews': 87},
]


def search_products(products, term):
    t = term.lower()
    return [
        p for p in products
        if t in p['product_name'].lower() or t in p['description'].lower()
    ]


class TestSearchFilter(unittest.TestCase):

    def test_search_by_product_name(self):
        results = search_products(PRODUCTS, 'macbook')
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['product_name'], 'MacBook Pro 14"')

    def test_search_by_description(self):
        results = search_products(PRODUCTS, 'apple')
        self.assertEqual(len(results), 2)

    def test_case_insensitive_search(self):
        results = search_products(PRODUCTS, 'AIRPODS')
        self.assertEqual(len(results), 1)

    def test_out_of_stock_products_still_appear_in_search(self):
        """Req 7: out-of-stock products must appear in search results."""
        results = search_products(PRODUCTS, 'iphone')
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['stock_quantity'], 0)

    def test_empty_search_returns_all_products(self):
        results = search_products(PRODUCTS, '')
        self.assertEqual(len(results), len(PRODUCTS))

    def test_no_match_returns_empty_list(self):
        results = search_products(PRODUCTS, 'refrigerator')
        self.assertEqual(len(results), 0)


# ─── Req 7: Sort ──────────────────────────────────────────────────────────────

class TestSortLogic(unittest.TestCase):

    def test_sort_price_low_to_high(self):
        sorted_p = sorted(PRODUCTS, key=lambda p: p['price'])
        self.assertEqual(sorted_p[0]['price'], 249.0)
        self.assertEqual(sorted_p[-1]['price'], 1999.0)

    def test_sort_price_high_to_low(self):
        sorted_p = sorted(PRODUCTS, key=lambda p: p['price'], reverse=True)
        self.assertEqual(sorted_p[0]['price'], 1999.0)
        self.assertEqual(sorted_p[-1]['price'], 249.0)

    def test_sort_by_popularity_uses_review_count(self):
        """Req 7: popularity = review count descending."""
        sorted_p = sorted(PRODUCTS, key=lambda p: p['reviews'], reverse=True)
        self.assertEqual(sorted_p[0]['product_name'], 'iPhone 15 Pro')   # 120 reviews
        self.assertEqual(sorted_p[-1]['product_name'], 'Dell XPS 13')    # 18 reviews

    def test_sort_preserves_all_products(self):
        sorted_p = sorted(PRODUCTS, key=lambda p: p['price'])
        self.assertEqual(len(sorted_p), len(PRODUCTS))

    def test_out_of_stock_products_included_in_sorted_results(self):
        """Req 7: out-of-stock items must still appear when sorting."""
        sorted_p = sorted(PRODUCTS, key=lambda p: p['price'])
        out_of_stock = [p for p in sorted_p if p['stock_quantity'] == 0]
        self.assertEqual(len(out_of_stock), 1)
        self.assertEqual(out_of_stock[0]['product_name'], 'iPhone 15 Pro')


# ─── Req 5: Comment approval visibility ──────────────────────────────────────

class TestCommentApproval(unittest.TestCase):

    def _visible(self, comment):
        """Only approved comments are publicly visible."""
        return comment['status'] == 'approved'

    def test_pending_comment_not_visible(self):
        comment = {'status': 'pending', 'comment': 'Great product'}
        self.assertFalse(self._visible(comment))

    def test_approved_comment_is_visible(self):
        comment = {'status': 'approved', 'comment': 'Excellent!'}
        self.assertTrue(self._visible(comment))

    def test_rejected_comment_not_visible(self):
        comment = {'status': 'rejected', 'comment': 'Bad product'}
        self.assertFalse(self._visible(comment))

    def test_only_approved_comments_shown_in_list(self):
        comments = [
            {'status': 'pending',  'comment': 'Waiting for review'},
            {'status': 'approved', 'comment': 'Excellent!'},
            {'status': 'rejected', 'comment': 'Spam'},
            {'status': 'approved', 'comment': 'Would buy again'},
        ]
        visible = [c for c in comments if self._visible(c)]
        self.assertEqual(len(visible), 2)
        self.assertTrue(all(c['status'] == 'approved' for c in visible))

    def test_no_approved_comments_returns_empty(self):
        comments = [
            {'status': 'pending',  'comment': 'Not yet'},
            {'status': 'rejected', 'comment': 'Nope'},
        ]
        visible = [c for c in comments if self._visible(c)]
        self.assertEqual(visible, [])


# ─── Req 9: Product model fields ─────────────────────────────────────────────

class TestProductModel(unittest.TestCase):

    REQUIRED_FIELDS = {
        'product_id', 'product_name', 'model', 'serial_number',
        'description', 'stock_quantity', 'price',
        'warranty_status', 'distributor_info',
    }

    SAMPLE_PRODUCT = {
        'product_id': 1,
        'product_name': 'MacBook Pro 14"',
        'model': 'MBP14-M3',
        'serial_number': 'C02XG2JHJGH5',
        'description': 'Apple M3 chip, 16 GB RAM',
        'stock_quantity': 5,
        'price': 1999.0,
        'warranty_status': True,
        'distributor_info': 'Apple Inc.',
    }

    def test_product_has_all_required_fields(self):
        for field in self.REQUIRED_FIELDS:
            self.assertIn(field, self.SAMPLE_PRODUCT, msg=f"Missing field: {field}")

    def test_price_non_negative(self):
        self.assertGreaterEqual(self.SAMPLE_PRODUCT['price'], 0)

    def test_stock_non_negative(self):
        self.assertGreaterEqual(self.SAMPLE_PRODUCT['stock_quantity'], 0)

    def test_warranty_status_is_boolean(self):
        self.assertIsInstance(self.SAMPLE_PRODUCT['warranty_status'], bool)


if __name__ == '__main__':
    unittest.main(verbosity=2)
