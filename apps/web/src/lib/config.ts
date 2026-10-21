export function authenticationConfigured(
  env: Record<string, string | undefined>,
) {
  return Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && env.CLERK_SECRET_KEY);
}
export function validateStaging(env: Record<string, string | undefined>) {
  if (env.APP_ENV !== "staging")
    throw new Error("APP_ENV must be staging for this foundation");
  if (
    env.SUPABASE_PROJECT_REF &&
    env.SUPABASE_PROJECT_REF !== "snpphkenmvmhpjstbeul"
  )
    throw new Error("Unexpected SUPABASE_PROJECT_REF");
  if (
    env.CLERK_ISSUER_URL &&
    env.CLERK_ISSUER_URL !== "https://immune-grizzly-7875.clerk.accounts.dev"
  )
    throw new Error("Unexpected CLERK_ISSUER_URL");
  if (
    Boolean(env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) !==
    Boolean(env.CLERK_SECRET_KEY)
  )
    throw new Error("Configure both Clerk keys");
  if (
    env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith("pk_test_")
  )
    throw new Error("Staging requires a Clerk test publishable key");
  if (env.CLERK_SECRET_KEY && !env.CLERK_SECRET_KEY.startsWith("sk_test_"))
    throw new Error("Staging requires a Clerk test secret key");
}
