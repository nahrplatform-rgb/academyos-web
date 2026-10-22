import { auth } from "@clerk/nextjs/server";
import OnboardingWorkspace from "@/components/onboarding-workspace";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{locale:string}>}){
 await auth.protect();const {locale}=await params;
 return <OnboardingWorkspace locale={locale} mode="context"/>;
}
