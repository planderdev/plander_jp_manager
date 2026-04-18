import { NextResponse } from 'next/server';
import { approveInfluencerApplication } from '@/lib/influencer-applications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await approveInfluencerApplication(id);
    return NextResponse.redirect(new URL('/influencers/applications', request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'approve_failed';
    console.error('approve route failed', error);
    return NextResponse.redirect(
      new URL(`/influencers/applications?error=${encodeURIComponent(message)}`, request.url),
      303
    );
  }
}
