import { NextResponse } from 'next/server';
import { rejectInfluencerApplication } from '@/lib/influencer-applications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await rejectInfluencerApplication(id);
    return NextResponse.redirect(new URL('/influencers/applications', request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'reject_failed';
    console.error('reject route failed', error);
    return NextResponse.redirect(
      new URL(`/influencers/applications?error=${encodeURIComponent(message)}`, request.url),
      303
    );
  }
}
