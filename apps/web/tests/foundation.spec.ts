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
      page.locator(`[dir="${locale === "ar" ? "rtl" : "ltr"}"]`),
    ).toBeVisible();
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
  expect((await request.post("/api/onboarding",{data:{action:"create"}})).status()).toBe(403);
  expect((await request.post("/api/jobs/invitations",{data:{invitation:"00000000-0000-4000-8000-000000000001",generation:1}})).status()).toBe(401);
  const invitation=await request.get("/en/invitation");
  expect(invitation.status()).toBe(200);
  expect(invitation.headers()["referrer-policy"]).toBe("no-referrer");
});
