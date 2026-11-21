import OnboardingWorkspace from "@/components/onboarding-workspace";
import { authenticationConfigured } from "@/lib/config";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;
 if(!authenticationConfigured(process.env))return <main><h1>{locale==='ar'?'الدعوات غير متاحة حالياً':'Invitations are currently unavailable'}</h1></main>;
 return <OnboardingWorkspace locale={locale} mode="invitation"/>;
}
