-- CREATE OR REPLACE in the earlier conflict repair dropped per-function SET limits.
-- Restore the original budgets without replacing bodies, grants or business data.
alter function public.m1_save_setup_v1(uuid,uuid,integer,text,jsonb)
  set statement_timeout = '3s';
alter function public.m1_save_setup_v1(uuid,uuid,integer,text,jsonb)
  set lock_timeout = '2s';
alter function public.m1_manage_invitation_v1(uuid,uuid,integer,text,text)
  set statement_timeout = '3s';
alter function public.m1_manage_invitation_v1(uuid,uuid,integer,text,text)
  set lock_timeout = '2s';
