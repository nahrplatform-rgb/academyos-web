-- Private synthetic media objects. A browser Clerk token is insufficient:
-- only the application signs one method and one object path at a time.
create function academy.x25_storage_allowed(object_name text, action text)
returns boolean language plpgsql security definer set search_path='' set statement_timeout='4s' as $$
declare
  parts text[];
  a uuid;
  e uuid;
  item uuid;
  slot text;
  claims jsonb := auth.jwt();
  headers jsonb;
  subject text := claims->>'sub';
  method text := current_setting('request.method',true);
  media academy.class_media_items;
  audience text;
begin
  if claims->>'iss' is distinct from 'https://immune-grizzly-7875.clerk.accounts.dev' or
     claims->>'role' is distinct from 'authenticated' or subject is null then return false; end if;
  if object_name !~ '^synthetic-class-media/v1/([a-f0-9-]{36}/){3}(main|thumbnail|part-[0-2])$' then return false; end if;
  if (action='select' and method not in ('GET','POST','DELETE')) or
     (action='insert' and method<>'POST') or (action='delete' and method<>'DELETE') or
     action not in ('select','insert','delete') or method is null then return false; end if;
  headers := nullif(current_setting('request.headers',true),'')::jsonb;
  if academy.m1_proof((headers->>'x-academyos-class-media')::jsonb,'class-media-storage',method||':'||object_name)
     is distinct from subject then return false; end if;
  parts:=string_to_array(object_name,'/');
  a:=parts[3]::uuid;
  e:=parts[4]::uuid;
  item:=parts[5]::uuid;
  slot:=parts[6];
  select i.* into media from academy.class_media_items i
   where i.id=item and i.academy_id=a and i.event_id=e and i.provider_protocol;
  if not found then return false; end if;
  audience:=academy.x25_role(a,e,subject,media.state<>'deleting');
  if method='POST' then
    return media.state='reserved' and media.created_by=subject and media.expires_at>academy.x25_now() and exists(
      select 1 from academy.class_media_variants v where v.item_id=item and v.variant=slot and v.state='pending'
    );
  end if;
  if media.state='deleting' then return audience='owner'; end if;
  if method='DELETE' then
    return slot like 'part-%' and media.state='reserved' and media.created_by=subject and exists(
      select 1 from academy.class_media_variants v where v.item_id=item and v.variant='main' and v.state='ready'
    );
  end if;
  if media.state='reserved' then return media.created_by=subject and media.expires_at>academy.x25_now(); end if;
  return slot in ('main','thumbnail') and media.expires_at>academy.x25_now() and
    (media.state='draft' or (media.state='published' and academy.x25_complete_consent(item)));
exception when insufficient_privilege or invalid_text_representation or numeric_value_out_of_range then return false;
end $$;
revoke all on function academy.x25_storage_allowed(text,text) from public,anon,authenticated;
grant execute on function academy.x25_storage_allowed(text,text) to authenticated;

create function public.x25_storage_exists_v1(a uuid,e uuid,item uuid,variant text)
returns boolean language plpgsql security definer set search_path='' set statement_timeout='4s' as $$
declare subject text; audience text; media academy.class_media_items; found_object boolean;
begin
  subject:=academy.verified_subject();
  select i.* into media from academy.class_media_items i
    where i.id=item and i.academy_id=a and i.event_id=e and i.provider_protocol;
  if not found or variant not in ('main','thumbnail','part-0','part-1','part-2') then
    raise exception 'Unavailable' using errcode='42501';
  end if;
  audience:=academy.x25_role(a,e,subject,media.state<>'deleting');
  if (media.state='deleting' and audience='owner') or
     (media.state='reserved' and media.created_by=subject and variant like 'part-%') then
    -- This read verifies actual catalog absence even if the API masked a denial as a 404.
    execute 'select exists(select 1 from storage.objects where bucket_id=''academy-media'' and name=$1)'
      into found_object using format('synthetic-class-media/v1/%s/%s/%s/%s',a,e,item,variant);
    return found_object;
  end if;
  raise exception 'Unavailable' using errcode='42501';
end $$;
revoke all on function public.x25_storage_exists_v1(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.x25_storage_exists_v1(uuid,uuid,uuid,text) to authenticated;

do $$ declare definition text:=pg_get_functiondef('academy.verified_subject()'::regprocedure); begin
  if position('|x25_query_v1|' in definition)=0 then raise exception 'Gateway anchor missing'; end if;
  execute replace(definition,'|x25_query_v1|','|x25_storage_exists_v1|x25_query_v1|');
  -- The socket-only rehearsal restores business schemas and supplies its own Storage baseline.
  if to_regclass('storage.objects') is not null then
    execute 'create policy x25_private_media_read on storage.objects for select to authenticated using
      (bucket_id=''academy-media'' and academy.x25_storage_allowed(name,''select''))';
    execute 'create policy x25_private_media_upload on storage.objects for insert to authenticated with check
      (bucket_id=''academy-media'' and academy.x25_storage_allowed(name,''insert''))';
    execute 'create policy x25_private_media_delete on storage.objects for delete to authenticated using
      (bucket_id=''academy-media'' and academy.x25_storage_allowed(name,''delete''))';
  end if;
end $$;
