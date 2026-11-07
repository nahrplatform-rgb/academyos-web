"""Contract tests for single-current routing and independent development/release."""
import copy
import csv
import unittest
from pathlib import Path

from build_continuation_prompt import execution_route, render

ROOT = Path(__file__).resolve().parents[2]


class ContinuationTests(unittest.TestCase):
    def setUp(self):
        with (ROOT / 'docs/06-delivery/experience-execution.csv').open(newline='') as stream:
            self.rows = list(csv.DictReader(stream))
        with (ROOT / 'docs/06-delivery/master-plan-v2/delivery-batches.csv').open(newline='') as stream:
            self.batches = list(csv.DictReader(stream))
        self.active = next(r for r in self.rows if r['execution_state'] == 'current')

    def test_deferred_promotion_does_not_replace_ready_development(self):
        self.active['development_next_action'] = 'READY_CONNECTED_WORK'
        self.active['release_follow_up'] = 'OWNER_DEFERRED_PROMOTION'
        result = render(self.rows, self.batches)
        self.assertLess(result.index('READY_CONNECTED_WORK'), result.index('OWNER_DEFERRED_PROMOTION'))
        self.assertIn('### Ready development action\n\nREADY_CONNECTED_WORK', result)
        self.assertIn('### Separate release follow-up\n\nOWNER_DEFERRED_PROMOTION', result)
        self.assertIn('Never promote', result)

    def test_missing_development_action_is_rejected(self):
        self.active['development_next_action'] = ''
        with self.assertRaises(ValueError):
            render(self.rows, self.batches)

    def test_missing_release_state_is_rejected(self):
        self.active['release_follow_up'] = ''
        with self.assertRaises(ValueError):
            render(self.rows, self.batches)

    def test_unknown_batch_is_rejected(self):
        self.active['delivery_batch'] = 'MP-B99'
        with self.assertRaises(ValueError):
            render(self.rows, self.batches)

    def test_unknown_product_outcome_is_rejected(self):
        batch = next(b for b in self.batches if b['batch_id'] == self.active['delivery_batch'])
        batch['product_outcome_ids'] = 'VAL-99'
        with self.assertRaises(ValueError):
            render(self.rows, self.batches)

    def test_current_batch_value_is_explained_without_claiming_results(self):
        result = render(self.rows, self.batches)
        self.assertIn('Product value for this batch:', result)
        self.assertIn('save Owner time', result)
        self.assertIn('Market leadership is an ambition, not a measured claim.', result)
        self.assertIn('finance-simplification-and-control.md', result)

    def test_duplicate_current_is_rejected(self):
        other = next(r for r in self.rows if r['execution_state'] == 'queued')
        other['execution_state'] = 'current'
        with self.assertRaises(ValueError):
            execution_route(self.rows)

    def test_earlier_unpassed_checkpoint_is_rejected(self):
        other = next(r for r in self.rows if r['execution_state'] == 'checkpoint_passed')
        other['execution_state'] = 'queued'
        with self.assertRaises(ValueError):
            execution_route(self.rows)

    def test_missing_primary_order_is_rejected(self):
        self.active['execution_order'] = '99'
        with self.assertRaises(ValueError):
            execution_route(self.rows)

    def test_release_update_changes_output_without_losing_development(self):
        self.active['development_next_action'] = 'READY_CONNECTED_WORK'
        before = render(self.rows, self.batches)
        self.active['release_follow_up'] = 'OWNER_REPORTED_PROMOTION_VERIFY_EXACT_SOURCE'
        after = render(self.rows, self.batches)
        self.assertNotEqual(before, after)
        self.assertIn('READY_CONNECTED_WORK', after)
        self.assertIn('OWNER_REPORTED_PROMOTION_VERIFY_EXACT_SOURCE', after)

    def test_next_batch_routes_only_after_explicit_checkpoint_change(self):
        self.active['execution_state'] = 'checkpoint_passed'
        next_row = min((r for r in self.rows if r['execution_state'] == 'queued'), key=lambda r: int(r['execution_order']))
        next_row['execution_state'] = 'current'
        result = render(self.rows, self.batches)
        self.assertIn(f"Current priority — {next_row['work_id']}", result)
        self.assertIn(f"Delivery batch: **{next_row['delivery_batch']}", result)
        self.assertIn('MP-B14', result)

    def test_render_does_not_mutate_tracker(self):
        before = copy.deepcopy(self.rows)
        render(self.rows, self.batches)
        self.assertEqual(before, self.rows)


if __name__ == '__main__':
    unittest.main()
