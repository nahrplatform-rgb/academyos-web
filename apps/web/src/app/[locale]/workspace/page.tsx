import { auth } from "@clerk/nextjs/server";
import OnboardingWorkspace from "@/components/onboarding-workspace";
import {localClassMediaEnabled, stagingClassMediaAcademy} from "@/lib/class-media-store";
export const dynamic="force-dynamic";
export default async function Page({params}:{params:Promise<{locale:string}>}){
 await auth.protect();const {locale}=await params;
 return <OnboardingWorkspace locale={locale} mode="context" galleryAcademy={stagingClassMediaAcademy() ?? (localClassMediaEnabled() ? 'local' : undefined)}/>;
}
