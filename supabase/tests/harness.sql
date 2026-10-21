-- Only for an empty disposable PostgreSQL database, never hosted application data.
create role anon;
create role authenticated;
create schema auth;
create function auth.jwt() returns jsonb language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
$$;
