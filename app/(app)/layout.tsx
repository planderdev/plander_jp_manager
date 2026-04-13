import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/actions/auth';
import Sidebar from '@/components/Sidebar';
import { PresentationProvider } from '@/lib/presentation-context';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Plander",
    template: "%s | Plander",
  },
  description: "Plander 인플루언서 관리 시스템",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const { data: admin } = await sb.from('admins').select('name, title').eq('id', user.id).single();
  const userName = admin?.title ? `${admin.title} ${admin.name}` : (admin?.name ?? user.email ?? '');

  return (
    <PresentationProvider>
      <div className="min-h-screen md:flex">
        <Sidebar userName={userName} signOutAction={signOutAction} />
        <main className="flex-1 bg-gray-50 min-w-0">{children}</main>
      </div>
    </PresentationProvider>
  );
}