-- EX-30 Phase 1h: Multi-academy foundation.
-- Academy roles already use academy.identities and academy.memberships.
-- Organization metadata has no effect on academy scope or subscriptions.
alter table academy.academies
  add column if not exists organization_id uuid;
