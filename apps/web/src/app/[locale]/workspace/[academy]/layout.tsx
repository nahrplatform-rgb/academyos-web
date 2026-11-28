import { notFound } from 'next/navigation';
import WorkspaceRuntime from '@/components/workspace-runtime';
import { uuidPattern } from '@/lib/onboarding';

export default async function Layout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ academy: string }>;
}) {
  const { academy } = await params;
  if (!uuidPattern.test(academy)) notFound();
  // No auth/bootstrap fetch in this reusable layout. Each protected page and
  // current API/data boundary still performs its existing authorization.
  return <WorkspaceRuntime academy={academy}>{children}</WorkspaceRuntime>;
}
