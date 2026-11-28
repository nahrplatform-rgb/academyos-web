-- EX-30 Phase 1g: allow the approved demo RPCs through the signed gateway.
-- Demo RPCs remain authenticated and role-scoped. No hosted apply is implied.

do $migration$
declare definition text := pg_get_functiondef('academy.verified_subject()'::regprocedure);
  marker text := 'my_academy_memberships_v1';
begin
  if strpos(definition, marker) = 0 then
    raise exception 'Unexpected gateway path contract';
  end if;
  definition := replace(definition, marker,
    'my_academy_memberships_v1|x30_create_demo|x30_use_invitation|x30_hold_demo|x30_delete_demo');
  execute definition;
end
$migration$;
