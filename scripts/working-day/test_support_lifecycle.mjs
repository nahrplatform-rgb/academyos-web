// EX-24 support lifecycle, authority, idempotency and gateway test.
//
// Creates a throwaway PostgreSQL 17 cluster, applies the Supabase test baseline
// and every repository migration with stop-on-error, then runs every assertion
// as the effective `authenticated` database role with a signed gateway proof.
//
// Usage: node scripts/working-day/test_support_lifecycle.mjs [--keep]
//   PG_BIN=/path/to/postgresql@17/bin   optional binary directory
//   SUPPORT_TEST_PORT=55450             optional first port to try
import { execFileSync } from "node:child_process";
import { createHmac } from "node:crypto";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../..");
const BIN = process.env.PG_BIN
  ?? (existsSync("/opt/homebrew/opt/postgresql@17/bin/initdb") ? "/opt/homebrew/opt/postgresql@17/bin" : "/opt/homebrew/bin");
const KEEP = process.argv.includes("--keep");
const HOST = "127.0.0.1";
const KEY = "a".repeat(64);
const ISSUER = "https://immune-grizzly-7875.clerk.accounts.dev";
const HEADER = "x-academyos-gateway";

const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "22222222-2222-4222-8222-222222222222";
const OWNER = "user_owner";
const FOREIGN = "user_foreign";
const MEMBER = "user_member";
const MULTI = "user_multi";
const STRANGER = "user_stranger";

let dir, port, started = false;
const bin = name => join(BIN, name);
const psqlFile = (file, extra = []) =>
  execFileSync(bin("psql"), ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-h", HOST, "-p", String(port), "-U", "postgres", "-f", file, ...extra], { encoding: "utf8" });
const sql = statement =>
  execFileSync(bin("psql"), ["-X", "-q", "-A", "-t", "-v", "ON_ERROR_STOP=1", "-h", HOST, "-p", String(port), "-U", "postgres", "-c", statement], { encoding: "utf8" }).trim();
const esc = value => String(value).replaceAll("'", "''");

function freePort() {
  const preferred = Number(process.env.SUPPORT_TEST_PORT ?? 55450);
  for (let candidate = preferred; candidate < preferred + 20; candidate++) {
    try {
      execFileSync(bin("pg_isready"), ["-h", HOST, "-p", String(candidate)], { stdio: "ignore" });
      // pg_isready exits 0 only when a server already answers there.
      continue;
    } catch { return candidate; }
  }
  throw new Error("No free PostgreSQL port found");
}

function start() {
  dir = mkdtempSync(join(tmpdir(), "academyos-ex24-"));
  port = freePort();
  execFileSync(bin("initdb"), ["-D", join(dir, "db"), "-U", "postgres", "-A", "trust", "--no-locale", "--encoding=UTF8"], { stdio: "ignore" });
  execFileSync(bin("pg_ctl"), ["-D", join(dir, "db"), "-l", join(dir, "log"), "-o", `-p ${port} -h ${HOST}`, "start"], { stdio: "ignore" });
  started = true;
  // Reject anything that is not the throwaway database we just created.
  const tables = sql("select count(*) from pg_tables where schemaname='academy';");
  if (tables !== "0") throw new Error("Target is not an empty disposable cluster");
  if (sql("select current_database();") !== "postgres") throw new Error("Unexpected database");
}

function stop() {
  if (started) execFileSync(bin("pg_ctl"), ["-D", join(dir, "db"), "-m", "immediate", "stop"], { stdio: "ignore" });
  if (!KEEP) rmSync(dir, { recursive: true, force: true });
  else console.log(`kept ${dir}`);
}

function applyBaseline() {
  psqlFile(join(ROOT, "supabase/tests/harness.sql"));
  // Portable Supabase shims for a plain cluster.
  sql("create or replace function auth.uid() returns uuid language sql stable as $$ select (current_setting('request.jwt.claims',true)::jsonb->>'sub')::uuid $$;");
  sql("create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);"
    + "create table storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text,metadata jsonb);"
    + "create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key);");
  for (const file of readdirSync(join(ROOT, "supabase/migrations")).filter(name => name.endsWith(".sql")).sort()) {
    try {
      psqlFile(join(ROOT, "supabase/migrations", file));
    } catch (error) {
      throw new Error(`Migration failed: ${file}\n${error.stderr ?? error.message}`);
    }
  }
  // Probe helper runs the given statement with the caller's effective privileges
  // and converts a refusal into data, so each case asserts an exact SQLSTATE.
  sql(`create function public.test_probe(statement text) returns jsonb language plpgsql security invoker set search_path='' as $$
    declare outcome text;
    begin
      execute statement into outcome;
      return jsonb_build_object('ok',true,'result',outcome);
    exception when others then
      return jsonb_build_object('ok',false,'state',SQLSTATE,'message',SQLERRM);
    end$$;`);
}

function fixture() {
  sql(`insert into academy.m1_secrets(purpose,secret) values('onboarding','${KEY}');`);
  const add = (id, clerk) => sql(`insert into academy.identities(id,clerk_subject) values('${id}','${clerk}');`);
  add("00000000-0000-4000-8000-000000000001", OWNER);
  add("00000000-0000-4000-8000-000000000002", FOREIGN);
  add("00000000-0000-4000-8000-000000000003", MEMBER);
  add("00000000-0000-4000-8000-000000000004", MULTI);
  add("00000000-0000-4000-8000-000000000005", STRANGER);
  sql(`insert into academy.academies(id,name) values('${A1}','Academy One'),('${A2}','Academy Two');`);
  sql(`insert into academy.memberships(identity_id,academy_id,role,status) values
    ('00000000-0000-4000-8000-000000000001','${A1}','owner','active'),
    ('00000000-0000-4000-8000-000000000002','${A2}','owner','active'),
    ('00000000-0000-4000-8000-000000000003','${A1}','trainer','active'),
    ('00000000-0000-4000-8000-000000000004','${A1}','trainer','active'),
    ('00000000-0000-4000-8000-000000000004','${A2}','manager','active');`);
}

function proof(subject, rpc) {
  const issued = Math.floor(Date.now() / 1000);
  const target = `POST:/rpc/${rpc}`;
  const signature = createHmac("sha256", KEY).update(["gateway", target, subject, String(issued), ""].join("\n")).digest("hex");
  return JSON.stringify({ purpose: "gateway", target, subject, emails: "", issued, signature });
}

// Executes one statement as the authenticated application role.
function probe(subject, rpc, statement, { headers = true } = {}) {
  const claims = JSON.stringify({ iss: ISSUER, sub: subject, role: "authenticated" });
  const requestHeaders = headers ? JSON.stringify({ [HEADER]: proof(subject, rpc) }) : "{}";
  const output = sql(`begin;
    set local role authenticated;
    set local request.jwt.claims='${esc(claims)}';
    set local request.path='/rpc/${rpc}';
    set local request.method='POST';
    set local request.headers='${esc(requestHeaders)}';
    select public.test_probe('${esc(statement)}');
    commit;`);
  return JSON.parse(output);
}

function callSubject(subject, rpc, statement) {
  const outcome = probe(subject, rpc, statement);
  if (!outcome.ok) throw new Error(`Expected success, got ${outcome.state}: ${outcome.message}`);
  return JSON.parse(outcome.result);
}

function expectRefusal(subject, rpc, statement, state, contains, options) {
  const outcome = probe(subject, rpc, statement, options);
  if (outcome.ok) throw new Error(`Expected refusal (${state}) but the statement succeeded: ${statement}`);
  if (outcome.state !== state) throw new Error(`Expected SQLSTATE ${state}, got ${outcome.state}: ${outcome.message}`);
  if (contains && !outcome.message.includes(contains)) throw new Error(`Expected message containing "${contains}", got: ${outcome.message}`);
  return outcome;
}

function expectNoLeak(subject, rpc, statement) {
  const value = callSubject(subject, rpc, statement);
  if (!Array.isArray(value) || value.length !== 0) throw new Error(`Expected no visible rows, got: ${JSON.stringify(value)}`);
}

const ticketCount = academy => Number(sql(`select count(*) from academy.support_tickets where academy_id='${academy}';`));
const messageCount = ticket => Number(sql(`select count(*) from academy.support_messages where ticket_id='${ticket}';`));

let failures = 0;
function case_(name, run) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failures++; console.error(`FAIL ${name}\n     ${error.message}`); }
}

start();
try {
  applyBaseline();
  fixture();

  const createRpc = "support_create_ticket_v1";
  const replyRpc = "support_reply_v1";
  const resolveRpc = "support_resolve_v1";
  const reopenRpc = "support_reopen_v1";
  const operationRpc = "support_operation_v1";
  const listRpc = "support_list_tickets_v1";
  const messageRpc = "support_list_messages_v1";

  const createOp = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
  const createAgainOp = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
  const replyOp = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
  const resolveOp = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
  const reopenOp = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";
  const staleResolveOp = "f1f1f1f1-f1f1-4f1f-8f1f-f1f1f1f1f1f1";
  const staleReopenOp = "f2f2f2f2-f2f2-4f2f-8f2f-f2f2f2f2f2f2";

  let ticket;
  case_("owner creates a ticket through the signed gateway", () => {
    const result = callSubject(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','Lifecycle ticket','Initial message','${createOp}')::text`);
    ticket = result.ticket_id;
    if (!/^[0-9a-f-]{36}$/.test(ticket)) throw new Error(`Unexpected ticket id ${ticket}`);
    if (result.status !== "open" || result.version !== 1) throw new Error(`Unexpected create result ${JSON.stringify(result)}`);
    if (ticketCount(A1) !== 1) throw new Error("Create did not persist exactly one ticket");
  });

  case_("reply persists one message in order", () => {
    const result = callSubject(OWNER, replyRpc,
      `select public.support_reply_v1('${A1}','${ticket}','Reply message','${replyOp}')::text`);
    if (result.message_id === undefined) throw new Error(`Reply returned ${JSON.stringify(result)}`);
    const messages = callSubject(OWNER, messageRpc, `select public.support_list_messages_v1('${A1}','${ticket}')::text`);
    if (!Array.isArray(messages) || messages.length !== 2) throw new Error(`Expected 2 messages, got ${JSON.stringify(messages)}`);
    if (messages[0].body !== "Initial message" || messages[1].body !== "Reply message") throw new Error("Message order or body changed");
    // Retrying the same reply operation must not add a third message.
    const retry = callSubject(OWNER, replyRpc,
      `select public.support_reply_v1('${A1}','${ticket}','Reply message','${replyOp}')::text`);
    if (retry.message_id !== result.message_id) throw new Error("Reply retry did not return the original message");
    if (messageCount(ticket) !== 2) throw new Error("Reply retry inserted a duplicate message");
  });

  case_("committed create with a lost reply recovers the original ticket", () => {
    // The first call above committed. A retried request reuses the same original
    // operation id, which is the only thing that proves recovery.
    const recovered = callSubject(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','Lifecycle ticket','Initial message','${createOp}')::text`);
    if (recovered.ticket_id !== ticket) throw new Error("Retry returned a different ticket");
    if (ticketCount(A1) !== 1) throw new Error(`Retry duplicated the ticket (count ${ticketCount(A1)})`);
    const reconciled = callSubject(OWNER, operationRpc, `select public.support_operation_v1('${A1}','${createOp}')::text`);
    if (reconciled.ticket_id !== ticket) throw new Error("Reconcile did not return the original ticket");
  });

  case_("negative control: a different operation id creates a second ticket", () => {
    // Proves the retry identity is the operation id, not identical payload text.
    const second = callSubject(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','Lifecycle ticket','Initial message','${createAgainOp}')::text`);
    if (second.ticket_id === ticket) throw new Error("Distinct operations collapsed into one ticket");
    if (ticketCount(A1) !== 2) throw new Error(`Expected 2 tickets, got ${ticketCount(A1)}`);
  });

  case_("a changed payload under the same operation id is refused", () => {
    const outcome = callSubject(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','Different subject','Initial message','${createOp}')::text`);
    if (outcome.error !== "conflict") throw new Error(`Expected conflict, got ${JSON.stringify(outcome)}`);
    if (ticketCount(A1) !== 2) throw new Error("Conflicting retry inserted a row");
  });

  case_("resolve then stale resolve is refused and preserves state", () => {
    const resolved = callSubject(OWNER, resolveRpc,
      `select public.support_resolve_v1('${A1}','${ticket}',1,'${resolveOp}')::text`);
    if (resolved.status !== "resolved" || resolved.version !== 2) throw new Error(`Unexpected resolve ${JSON.stringify(resolved)}`);
    const stale = callSubject(OWNER, resolveRpc,
      `select public.support_resolve_v1('${A1}','${ticket}',1,'${staleResolveOp}')::text`);
    if (stale.error !== "stale" || stale.version !== 2) throw new Error(`Expected stale version 2, got ${JSON.stringify(stale)}`);
  });

  case_("reopen then stale reopen is refused and preserves state", () => {
    const reopened = callSubject(OWNER, reopenRpc,
      `select public.support_reopen_v1('${A1}','${ticket}',2,'${reopenOp}')::text`);
    if (reopened.status !== "reopened" || reopened.version !== 3) throw new Error(`Unexpected reopen ${JSON.stringify(reopened)}`);
    const stale = callSubject(OWNER, reopenRpc,
      `select public.support_reopen_v1('${A1}','${ticket}',2,'${staleReopenOp}')::text`);
    if (stale.error !== "stale" || stale.version !== 3) throw new Error(`Expected stale version 3, got ${JSON.stringify(stale)}`);
  });

  case_("final state matches the created ticket id, not the first row", () => {
    const row = sql(`select row_to_json(t) from (select id,status,version from academy.support_tickets where id='${ticket}') t;`);
    const parsed = JSON.parse(row);
    if (parsed.id !== ticket || parsed.status !== "reopened" || Number(parsed.version) !== 3) {
      throw new Error(`Unexpected final row ${row}`);
    }
    if (messageCount(ticket) !== 2) throw new Error("Unexpected message count after transitions");
  });

  case_("cross-academy member sees nothing and cannot reply", () => {
    expectNoLeak(FOREIGN, listRpc, `select public.support_list_tickets_v1('${A1}')::text`);
    expectRefusal(FOREIGN, replyRpc,
      `select public.support_reply_v1('${A1}','${ticket}','Foreign reply','${"ffffffff-ffff-4fff-8fff-ffffffffffff"}')::text`,
      "42501", "Access denied");
    if (messageCount(ticket) !== 2) throw new Error("Foreign reply inserted a message");
  });

  case_("same-academy member sees the thread and can reply", () => {
    const list = callSubject(MEMBER, listRpc, `select public.support_list_tickets_v1('${A1}')::text`);
    if (!Array.isArray(list) || !list.some(item => item.id === ticket)) throw new Error("Same-academy member could not see the ticket");
    const reply = callSubject(MEMBER, replyRpc,
      `select public.support_reply_v1('${A1}','${ticket}','Member reply','${"99999999-9999-4999-8999-999999999999"}')::text`);
    if (reply.message_id === undefined) throw new Error("Same-academy reply failed");
    if (messageCount(ticket) !== 3) throw new Error("Same-academy reply did not persist");
  });

  case_("ended membership loses read and write access", () => {
    sql(`update academy.memberships set status='ended' where academy_id='${A1}' and identity_id='00000000-0000-4000-8000-000000000003';`);
    expectNoLeak(MEMBER, listRpc, `select public.support_list_tickets_v1('${A1}')::text`);
    expectRefusal(MEMBER, replyRpc,
      `select public.support_reply_v1('${A1}','${ticket}','Ended reply','${"88888888-8888-4888-8888-888888888888"}')::text`,
      "42501", "Access denied");
  });

  case_("a subject with no membership is refused", () => {
    expectRefusal(STRANGER, createRpc,
      `select public.support_create_ticket_v1('${A1}','Stranger','Stranger message','${"77777777-7777-4777-8777-777777777777"}')::text`,
      "42501", "Access denied");
    if (ticketCount(A1) !== 2) throw new Error("Stranger created a ticket");
  });

  case_("one identity with two academies keeps each workspace isolated", () => {
    const one = callSubject(MULTI, createRpc,
      `select public.support_create_ticket_v1('${A1}','Multi A1','Only A1','${"10101010-1010-4010-8010-101010101010"}')::text`);
    const two = callSubject(MULTI, createRpc,
      `select public.support_create_ticket_v1('${A2}','Multi A2','Only A2','${"20202020-2020-4020-8020-202020202020"}')::text`);
    const listA1 = callSubject(MULTI, listRpc, `select public.support_list_tickets_v1('${A1}')::text`);
    const listA2 = callSubject(MULTI, listRpc, `select public.support_list_tickets_v1('${A2}')::text`);
    if (!listA1.some(item => item.id === one.ticket_id)) throw new Error("A1 ticket missing from A1");
    if (listA1.some(item => item.id === two.ticket_id)) throw new Error("A2 ticket leaked into A1");
    if (!listA2.some(item => item.id === two.ticket_id)) throw new Error("A2 ticket missing from A2");
    if (listA2.some(item => item.id === one.ticket_id)) throw new Error("A1 ticket leaked into A2");
  });

  case_("direct table reads and writes are denied to the application role", () => {
    expectRefusal(OWNER, listRpc, `select count(*)::text from academy.support_tickets`, "42501", "permission denied");
    expectRefusal(OWNER, listRpc, `select count(*)::text from academy.support_messages`, "42501", "permission denied");
    expectRefusal(OWNER, listRpc, `select count(*)::text from academy.support_operations`, "42501", "permission denied");
    expectRefusal(OWNER, listRpc,
      `insert into academy.support_tickets(academy_id,created_by,subject) values('${A1}','${OWNER}','Direct') returning id::text`,
      "42501", "permission denied");
  });

  case_("table grants and schema usage are actually revoked", () => {
    for (const table of ["support_tickets", "support_messages", "support_operations", "inbox_messages"]) {
      for (const privilege of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
        if (sql(`select has_table_privilege('authenticated','academy.${table}','${privilege}');`) !== "f")
          throw new Error(`authenticated still has ${privilege} on ${table}`);
      }
    }
    if (sql(`select has_schema_privilege('authenticated','academy','USAGE');`) !== "f")
      throw new Error("authenticated still has USAGE on the academy schema");
    if (sql(`select has_function_privilege('authenticated','public.support_create_ticket_v1(uuid,text,text,uuid)','EXECUTE');`) !== "t")
      throw new Error("authenticated cannot execute the signed support function");
    if (sql(`select has_function_privilege('anon','public.support_create_ticket_v1(uuid,text,text,uuid)','EXECUTE');`) !== "f")
      throw new Error("anon can execute the signed support function");
  });

  case_("the gateway proof is required, not just JWT claims", () => {
    expectRefusal(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','No proof','No proof','${"30303030-3030-4030-8030-303030303030"}')::text`,
      "42501", "Gateway required", { headers: false });
  });

  case_("invalid input is refused with a validation error", () => {
    expectRefusal(OWNER, createRpc,
      `select public.support_create_ticket_v1('${A1}','','','${"40404040-4040-4040-8040-404040404040"}')::text`,
      "22023", "Invalid ticket");
  });

  case_("operations and audits are recorded once per original", () => {
    const ops = Number(sql(`select count(*) from academy.support_operations where actor='${OWNER}';`));
    if (ops !== 5) throw new Error(`Expected 5 original operations for ${OWNER}, got ${ops}`);
    const audits = Number(sql(`select count(*) from academy.audit_events where actor='${OWNER}' and action like 'support.%';`));
    if (audits !== 5) throw new Error(`Expected 5 support audits for ${OWNER}, got ${audits}`);
  });
} finally {
  stop();
}

if (failures) {
  console.error(`\n${failures} case(s) failed`);
  process.exit(1);
}
console.log("\nALL SUPPORT CASES PASSED");
