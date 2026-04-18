import { NextResponse } from 'next/server';
import { rejectInfluencerApplication } from '@/lib/influencer-applications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await rejectInfluencerApplication(id);

  return NextResponse.redirect(new URL('/influencers/applications', request.url), 303);
}
