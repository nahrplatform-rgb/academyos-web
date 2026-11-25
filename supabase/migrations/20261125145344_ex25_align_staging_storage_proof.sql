-- Align an existing staging policy function with the verified EX-25 app.
-- Fresh installs already have the corrected call in the original migration.
do $$
declare
  definition text := pg_get_functiondef('academy.x25_storage_allowed(text,text)'::regprocedure);
  previous_call constant text := $call$academy.m1_proof((headers->>'x-academyos-class-media')::jsonb,'class-media-storage',method||':'||object_name)$call$;
  expected_call constant text := $call$academy.m1_proof((headers->>'x-academyos-class-media')::jsonb,'gateway','class-media-storage:'||method||':'||object_name)$call$;
begin
  if position(previous_call in definition) > 0 and position(expected_call in definition) = 0 then
    execute replace(definition, previous_call, expected_call);
  elsif position(expected_call in definition) = 0 or position(previous_call in definition) > 0 then
    raise exception 'Unexpected EX-25 Storage proof verification';
  end if;
end $$;
