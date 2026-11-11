'use client';

import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { WorkspaceReadOwner } from '@/lib/workspace-read-owner';

const RuntimeContext = createContext<WorkspaceReadOwner | null>(null);

function ScopedRuntime({ subject, academy, children }: { subject: string; academy: string; children: ReactNode }) {
  const owner = useMemo(() => new WorkspaceReadOwner(subject, academy), [subject, academy]);
  useEffect(() => () => owner.cancelAll(), [owner]);
  return <RuntimeContext value={owner}>{children}</RuntimeContext>;
}

/** Layout lifetime, not membership authority. Existing protected pages/API checks remain. */
export default function WorkspaceRuntime({ academy, children }: { academy: string; children: ReactNode }) {
  const session = useUser();
  if (!session.isLoaded || !session.user) return <RuntimeContext value={null}>{children}</RuntimeContext>;
  return <ScopedRuntime key={`${session.user.id}:${academy}`} subject={session.user.id} academy={academy}>{children}</ScopedRuntime>;
}

export function useWorkspaceReadOwner(subject: string, academy: string) {
  const shared = useContext(RuntimeContext);
  // Actual-component isolated rendering and unmigrated embedding retain the same
  // online contract without borrowing an incompatible workspace's owner.
  const local = useMemo(() => shared?.matches(subject, academy) ? null : new WorkspaceReadOwner(subject, academy), [shared, subject, academy]);
  useEffect(() => () => local?.cancelAll(), [local]);
  return local ?? shared!;
}
