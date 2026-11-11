import type {Metadata} from 'next';
import PreparedRegisterStartup from '@/components/prepared-register-startup';

export const dynamic='force-static';
export const metadata:Metadata={title:'AcademyOS · Prepared register',robots:{index:false,follow:false}};

export default function Page() {
  return <main id="academyos-public-register-shell">
    <PreparedRegisterStartup/>
  </main>;
}
