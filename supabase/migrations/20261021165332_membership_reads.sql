-- Narrow RPC boundary: private tables remain inaccessible to API roles.
create index memberships_active_identity_idx on academy.memberships(identity_id, academy_id) where status = 'active';
create function academy.verified_subject() returns text
language plpgsql stable security invoker set search_path = '' as $$
declare claims jsonb := auth.jwt();
begin
 if claims->>'iss' is distinct from 'https://immune-grizzly-7875.clerk.accounts.dev'
    or coalesce(claims->>'sub','') not like 'user_%'
    or claims->>'role' is distinct from 'authenticated' then
   raise exception 'Invalid identity' using errcode = '42501';
 end if;
 return claims->>'sub';
end;
$$;
revoke all on function academy.verified_subject() from public, anon, authenticated;

-- SECURITY DEFINER is intentional: it exposes only caller-scoped operations,
-- with fixed search_path and no subject/role parameters or table grants.
create function public.bootstrap_identity_v1() returns uuid
language plpgsql security definer set search_path = '' as $$
declare subject text := academy.verified_subject(); result uuid;
begin
 insert into academy.identities(clerk_subject) values(subject)
 on conflict(clerk_subject) do nothing;
 select id into strict result from academy.identities where clerk_subject = subject;
 return result;
end;
$$;
revoke all on function public.bootstrap_identity_v1() from public, anon;
grant execute on function public.bootstrap_identity_v1() to authenticated;

create function public.my_academy_memberships_v1()
returns table(membership_id uuid, academy_id uuid, academy_name text, role text)
language plpgsql stable security definer set search_path = '' as $$
declare subject text := academy.verified_subject();
begin
 return query select m.id,a.id,a.name,m.role
 from academy.identities i
 join academy.memberships m on m.identity_id=i.id and m.status='active'
 join academy.academies a on a.id=m.academy_id
 where i.clerk_subject=subject;
end;
$$;
revoke all on function public.my_academy_memberships_v1() from public, anon;
grant execute on function public.my_academy_memberships_v1() to authenticated;
