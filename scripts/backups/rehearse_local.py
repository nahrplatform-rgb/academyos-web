#!/usr/bin/env python3
"""Restore a trusted recovered dump into a new disposable, socket-only PG17.

Never accepts a host, port, connection URL or existing database. The recovery
receipt must first be compared to a trusted successful GitHub run's digest.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import tempfile

from backup import command, BackupError, PROJECT


def reviewed_migrations(repo, migration):
    paths = [] if migration is None else [migration] if isinstance(migration, Path) else list(migration)
    checked = []
    for path in paths:
        path = path.resolve()
        if path.parent != (repo / "supabase/migrations").resolve() or path.suffix != ".sql" or not path.is_file():
            raise BackupError("Migration must be a reviewed repository migration")
        checked.append(path)
    if len(set(checked)) != len(checked) or checked != sorted(checked):
        raise BackupError("Reviewed migrations must be unique and in repository version order")
    return checked


def existing_rows(env, new_player_columns=()):
    # Disposable restored database only. Return counts/hashes, never row values.
    return json.loads(command(["psql", "-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", """
    create function pg_temp.rehearsal_rows() returns jsonb language plpgsql as $$
    declare relation record; fingerprint jsonb; result jsonb := '{}'::jsonb; projection text;
    begin
      for relation in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace
        where n.nspname='academy' and c.relkind='r' order by c.relname
      loop
        projection := case when relation.relname='players'
          then '(to_jsonb(t)PLAYER_ADDITIONS)::text' else 'to_jsonb(t)::text' end;
        execute format('select jsonb_build_object(''rows'',count(*),''sha256'',
          encode(extensions.digest(coalesce(string_agg(%1$s,E''\\n''
            order by %1$s collate "C"),''''),''sha256''),''hex'')) from academy.%2$I t',
          projection,relation.relname) into fingerprint;
        result := result || jsonb_build_object(relation.relname,fingerprint);
      end loop;
      return result;
    end $$;
    select pg_temp.rehearsal_rows();
    """.replace("PLAYER_ADDITIONS", "".join(
        f"-''{column}''" for column in ("academy_member_number", "alternate_name")
        if column in new_player_columns))], env))


def rehearse(payload, migration=None, preserve_existing_rows=False, player_additions=False):
    manifest = json.loads((payload / "manifest.json").read_text())
    if manifest["project"] != PROJECT:
        raise BackupError("Wrong recovery project")
    repo = Path(__file__).resolve().parents[2]
    migrations = reviewed_migrations(repo, migration)
    if preserve_existing_rows and not migrations:
        raise BackupError("Existing-row comparison requires a reviewed migration")
    if player_additions and (not preserve_existing_rows or
            not any(path.name == "20261120013009_player_academy_member_number.sql" for path in migrations)):
        raise BackupError("Player backfill comparison requires the member-number migration and existing-row check")
    os.umask(0o077)
    with tempfile.TemporaryDirectory(prefix="academyos-restore-") as tmp:
        root = Path(tmp)
        data = root / "data"
        sockets = root / "sockets"
        sockets.mkdir(mode=0o700)
        env = {k: v for k, v in os.environ.items() if not k.startswith("PG")}
        env.update(PGHOST=str(sockets), PGPORT="55440", PGUSER="postgres", PGDATABASE="postgres")
        command(["initdb", "-D", str(data), "-U", "postgres", "-A", "trust", "--no-locale", "--encoding=UTF8"])
        command(["pg_ctl", "-D", str(data), "-l", str(root / "postgres.log"), "-o",
                 f"-p 55440 -k {sockets} -c listen_addresses='' -c unix_socket_permissions=0700", "-w", "start"])
        try:
            baseline = """
            create role anon; create role authenticated; create role service_role;
            create role supabase_admin; create role supabase_auth_admin;
            create role supabase_storage_admin; create role authenticator;
            create role dashboard_user; create role pgbouncer;
            create role supabase_read_only_user; create role supabase_realtime_admin;
            -- pg_dump is deliberately scoped to business schemas. Recreate this
            -- pinned baseline dependency used by the restored signing functions.
            create schema if not exists extensions;
            create extension if not exists pgcrypto with schema extensions;
            create schema auth;
            create function auth.jwt() returns jsonb language sql stable as $$
              select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb
            $$;
            """
            command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-c", baseline], env)
            # Keep initdb's standard public schema baseline. pg_dump omits its
            # initial default ACL; recreating it would lose PUBLIC USAGE. Keep
            # explicit archived ACL/default-ACL entries, skipping only CREATE.
            toc = command(["pg_restore", "--list", str(payload / "database.dump")]).decode()
            restore_list = root / "restore.list"
            restore_list.write_text("\n".join(line for line in toc.splitlines() if not re.match(r"^\d+; \d+ \d+ SCHEMA - public ", line)) + "\n")
            command(["pg_restore", "--exit-on-error", "--no-owner", "--use-list", str(restore_list), "--dbname=postgres", str(payload / "database.dump")], env)
            new_player_columns = []
            if player_additions:
                present = command(["psql","-X","-At","-v","ON_ERROR_STOP=1","-c", """
                select column_name from information_schema.columns where table_schema='academy' and table_name='players'
                  and column_name in ('academy_member_number','alternate_name');
                """], env).decode().splitlines()
                if "academy_member_number" in present:
                    raise BackupError("Member numbers already exist in the snapshot")
                adding_alternate = any(path.name == "20261119233028_player_alternate_name.sql" for path in migrations)
                if adding_alternate == ("alternate_name" in present):
                    raise BackupError("Alternate-name migration does not match the snapshot schema")
                new_player_columns = ["academy_member_number"] + (["alternate_name"] if adding_alternate else [])
            before = existing_rows(env, new_player_columns) if preserve_existing_rows else None
            if migrations:
                # One transaction for the complete reviewed release. An error
                # cannot leave an intermediate public function/grant in place.
                command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "--single-transaction",
                         *[arg for path in migrations for arg in ("-f", str(path))]], env)
            integrity = None
            if before is not None:
                after = existing_rows(env, new_player_columns)
                if any(after.get(table) != fingerprint for table, fingerprint in before.items()):
                    raise BackupError("Reviewed migration changed existing academy rows")
                integrity = {"existing_tables_checked": len(before),
                             "existing_rows_checked": sum(value["rows"] for value in before.values()),
                             "existing_rows_preserved": True,
                             "before_sha256": hashlib.sha256(json.dumps(before, sort_keys=True).encode()).hexdigest(),
                             "after_existing_sha256": hashlib.sha256(json.dumps({table: after[table] for table in before}, sort_keys=True).encode()).hexdigest(),
                             "new_tables": sorted(set(after)-set(before))}
                if player_additions:
                    verified = command(["psql","-X","-At","-v","ON_ERROR_STOP=1","-c", """
                    select not exists (
                      select from (select academy_id,count(*) n,count(distinct academy_member_number) distinct_n,
                        min(academy_member_number) low,max(academy_member_number) high
                        from academy.players group by academy_id) p
                      full join academy.player_member_counters c using(academy_id)
                      where p.n is null or c.last_number is null or p.n<>p.distinct_n
                        or p.low<>1 or p.high<>p.n or c.last_number<>p.high
                    )""" + (" and not exists(select from academy.players where alternate_name is not null)"
                            if adding_alternate else "") + ";"], env).strip()
                    if verified != b"t":
                        raise BackupError("Player generated backfill or counters differ")
                    integrity["player_backfill_verified"] = True
                    integrity["new_player_columns_excluded_from_fingerprint"] = new_player_columns
            # Fixed synthetic transaction rolls back. Restored identity values
            # and the SQL dump are never printed to the console.
            command(["psql", "-X", "-v", "ON_ERROR_STOP=1", "-f", str(repo / "supabase/tests/membership_boundary.sql")], env)
            result = json.loads(command(["psql", "-X", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-c", """
            select json_build_object(
              'identities', (select count(*) from academy.identities),
              'academies', (select count(*) from academy.academies),
              'memberships', (select count(*) from academy.memberships),
              'private_tables_with_rls', (select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='academy' and c.relkind='r' and c.relrowsecurity));
            """], env))
            return {"project": PROJECT, "run_id": manifest["run_id"], "database_restore_passed": True,
                    "membership_boundary_passed": True,
                    "migration_rehearsed": migrations[0].name if len(migrations) == 1 else None,
                    "migrations_rehearsed": [{"file": path.name, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()} for path in migrations],
                    "counts": result,
                    "existing_row_comparison": integrity,
                    "hosted_storage_restore_tested": False}
        finally:
            command(["pg_ctl", "-D", str(data), "-m", "fast", "-w", "stop"])


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("payload", type=Path)
    parser.add_argument("--migration", type=Path, action="append", help="Replay reviewed repository migration(s), in version order and one transaction, inside the disposable restore only")
    parser.add_argument("--preserve-existing-rows", action="store_true", help="Fail if the reviewed release changes rows in any existing academy table; new tables are allowed")
    parser.add_argument("--player-number-backfill", action="store_true", help="Compare original Player columns and verify backfilled member numbers separately")
    args = parser.parse_args()
    try:
        print(json.dumps(rehearse(args.payload,args.migration,args.preserve_existing_rows,args.player_number_backfill)))
    except Exception as error:
        print(f"Restore rehearsal failed: {error if isinstance(error, BackupError) else type(error).__name__}")
        raise SystemExit(1)
