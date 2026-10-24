import { test, expect } from "@playwright/test";
test("English and Arabic starter pages truthfully show pending setup", async ({
  page,
}) => {
  for (const [locale, title] of [
    ["en", "Your academy, connected."],
    ["ar", "أكاديميتك، في مكان واحد."],
  ]) {
    await page.goto(`/${locale}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(
      page.locator(`.app-scene[dir="${locale === "ar" ? "rtl" : "ltr"}"]`),
    ).toBeVisible();
    await expect(page.locator('.app-scene')).toHaveAttribute('lang', locale);
    await expect(page.locator('.app-scene')).toHaveCSS('direction', locale === 'ar' ? 'rtl' : 'ltr');
    await expect(page.locator("article")).toHaveCount(4);
  }
});
test("phone layout does not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  for (const locale of ["en", "ar"]) {
    await page.goto(`/${locale}`);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});
test("unconfigured workspace fails closed and health is process only", async ({
  request,
}) => {
  expect((await request.get("/en/workspace")).status()).toBe(503);
  expect((await request.get("/ar/workspace")).status()).toBe(503);
  expect(await (await request.get("/api/health")).json()).toEqual({
    status: "ok",
    service: "academyos-web",
    scope: "process-only",
  });
  expect((await request.get("/fr")).status()).toBe(404);
  expect((await request.post("/api/setup/verify")).status()).toBe(404);
  expect((await request.post("/api/setup/email")).status()).toBe(404);
  expect((await request.post("/api/jobs/setup")).status()).toBe(404);
});

test("onboarding fails closed without identity and rejects forged callbacks", async ({request}) => {
  for(const path of ["/en/platform","/ar/platform","/en/workspace/00000000-0000-4000-8000-000000000001"])
    expect((await request.get(path)).status()).toBe(503);
  const denied = await request.post("/api/onboarding",{data:{action:"create"}});
  expect(denied.status()).toBe(403);
  expect(denied.headers()["cache-control"]).toBe("no-store");
  const timing = denied.headers()["server-timing"];
  expect(timing).toMatch(/^request;dur=\d+\.\d, total;dur=\d+\.\d$/);
  expect(timing.length).toBeLessThan(256);
  expect((await request.post("/api/jobs/invitations",{data:{invitation:"00000000-0000-4000-8000-000000000001",generation:1}})).status()).toBe(401);
  const invitation=await request.get("/en/invitation");
  expect(invitation.status()).toBe(200);
  expect(invitation.headers()["referrer-policy"]).toBe("no-referrer");
});

test("Clerk email callback denies unsigned requests without exposing payload or caching", async ({request}) => {
  const r=await request.post('/api/webhooks/clerk-email',{data:{type:'email.created',data:{otp_code:'synthetic-not-a-code'}}});
  expect(r.status()).toBe(401);
  expect(await r.json()).toEqual({outcome:'denied'});
  expect(r.headers()['cache-control']).toBe('no-store');
  expect(r.headers()['referrer-policy']).toBe('no-referrer');
});
