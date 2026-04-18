import { NextResponse } from 'next/server';
import { deleteInfluencerApplication } from '@/lib/influencer-applications';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await deleteInfluencerApplication(id);
    return NextResponse.redirect(new URL('/influencers/applications', request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'delete_failed';
    console.error('delete route failed', error);
    return NextResponse.redirect(
      new URL(`/influencers/applications?error=${encodeURIComponent(message)}`, request.url),
      303
    );
  }
}
