import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { authenticationConfigured, validateStaging, STAGING_ORIGIN } from "@/lib/config";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? STAGING_ORIGIN),
  title: "AcademyOS · Staging",
  description: "Your academy, connected.",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  validateStaging({
    ...process.env,
    APP_ENV: process.env.APP_ENV ?? "staging",
  });
  return (
    <html lang="en">
      <body>
        {authenticationConfigured(process.env) ? (
          <ClerkProvider>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
