export function GET() {
  return Response.json(
    { status: "ok", service: "academyos-web", scope: "process-only" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
