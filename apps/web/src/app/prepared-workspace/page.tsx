import type {Metadata} from 'next';
import PreparedWorkspaceStartup from '@/components/prepared-workspace-startup';

export const dynamic='force-static';
export const metadata:Metadata={title:'AcademyOS · Workspace',robots:{index:false,follow:false}};

export default function Page() {
  return <div id="academyos-public-workspace-shell"><PreparedWorkspaceStartup/></div>;
}
