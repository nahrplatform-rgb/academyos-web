-- Academy membership IDs are distinct from player UUIDs and future sport IDs.
alter table academy.players add column academy_member_number bigint;

with numbered as (
  select id, row_number() over (partition by academy_id order by created_at, id) as number
  from academy.players
)
update academy.players p set academy_member_number = n.number
from numbered n where n.id = p.id;

alter table academy.players
  alter column academy_member_number set not null,
  add constraint players_academy_member_number_positive check (academy_member_number > 0),
  add constraint players_academy_member_number_unique unique (academy_id, academy_member_number);

create table academy.player_member_counters (
  academy_id uuid primary key references academy.academies,
  last_number bigint not null check (last_number > 0)
);
alter table academy.player_member_counters enable row level security;
revoke all on academy.player_member_counters from public, anon, authenticated;

insert into academy.player_member_counters (academy_id, last_number)
select academy_id, max(academy_member_number) from academy.players group by academy_id;

create function academy.assign_player_member_number() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into academy.player_member_counters as c (academy_id, last_number)
  values (new.academy_id, 1)
  on conflict (academy_id) do update set last_number = c.last_number + 1
  returning last_number into new.academy_member_number;
  return new;
end $$;
revoke all on function academy.assign_player_member_number() from public, anon, authenticated;

create trigger player_academy_member_number
before insert on academy.players
for each row execute function academy.assign_player_member_number();

create function academy.keep_player_member_number() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.academy_member_number is distinct from old.academy_member_number then
    raise exception 'Academy member number cannot be reassigned' using errcode = '22023';
  end if;
  return new;
end $$;
revoke all on function academy.keep_player_member_number() from public, anon, authenticated;

create trigger keep_player_academy_member_number
before update of academy_member_number on academy.players
for each row execute function academy.keep_player_member_number();

create or replace function public.i2_profile_v1(a uuid, player uuid) returns jsonb
language plpgsql security definer set search_path='' set statement_timeout='3s' set lock_timeout='2s' as $$
declare s text:=academy.i2_owner(a); r jsonb;begin
 select jsonb_build_object('id',p.id,'display_name',p.display_name,'branch_name',b.name,
   'contact_email',p.contact_email,'version',p.version,'created_at',p.created_at,
   'academy_member_number',p.academy_member_number::text)
  || case when p.alternate_name is null then '{}'::jsonb
     else jsonb_build_object('alternate_name',p.alternate_name) end into r
 from academy.players p join academy.branches b on b.id=p.branch_id where p.academy_id=a and p.id=player;
 if r is null then raise exception 'Access denied' using errcode='42501';end if;return r;
end $$;
