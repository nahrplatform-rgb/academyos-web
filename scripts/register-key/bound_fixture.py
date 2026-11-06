"""Shared fixture-only helpers for the registered private transport migration."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KEY = '20261104012057_owner_register_key_custody.sql'
BOUND = '20261104013632_owner_register_bound_transport.sql'
BINDING = '20261106174606_owner_register_binding_conflict.sql'


def literal(value):
    return "'" + str(value).replace("'", "''") + "'"


def apply_bound(fixture):
    for name in (KEY, BOUND, BINDING):
        fixture.sql((ROOT / 'supabase/migrations' / name).read_text())


def seed_slot(fixture, command):
    a, ev, ns, device = (literal(command[k]) for k in ('academy', 'event', 'namespace', 'device'))
    # Canonical transfer/dispatch fixtures use their own fictional client keys.
    fixture.sql(f"insert into academy.owner_register_keys(subject,academy_id,event_id,namespace,device_id,wrapped_key) "
                f"values({literal(command['subject'])},{a},{ev},{ns},{device},repeat('A',80))")
    return True
