import { auth } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import ClassMediaGallery from '@/components/class-media-gallery';
import { localClassMediaEnabled, stagingClassMediaAcademy } from '@/lib/class-media-store';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ locale: string; academy: string }> }) {
  const props = await params;
  if (!['en', 'ar'].includes(props.locale) ||
      (!localClassMediaEnabled() && stagingClassMediaAcademy() !== props.academy)) notFound();
  await auth.protect();
  return <ClassMediaGallery {...props} />;
}
