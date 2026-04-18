import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { restoreInfluencerApplication } from '@/lib/influencer-applications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sb = await createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url), 303);
  }

  const { id } = await params;
  await restoreInfluencerApplication(id);

  revalidatePath('/influencers/applications');

  return NextResponse.redirect(new URL('/influencers/applications', request.url), 303);
}
