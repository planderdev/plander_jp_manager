import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { signOutAction } from '@/actions/auth';
import Sidebar from '@/components/Sidebar';
import { PresentationProvider } from '@/lib/presentation-context';
import { NotificationProvider } from '@/lib/notification-context';
import { readFlashMessage } from '@/lib/flash';

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Plander",
    template: "%s | Plander",
  },
  description: "Plander Korea and Japan campaign management system",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');
  const flashMessage = await readFlashMessage();

  const { data: admin } = await sb.from('admins').select('name, title').eq('id', user.id).single();
  const userName = admin?.title ? `${admin.title} ${admin.name}` : (admin?.name ?? user.email ?? '');

  return (
    <PresentationProvider>
      <NotificationProvider initialFlash={flashMessage}>
        <div className="min-h-screen">
          <Sidebar userName={userName} signOutAction={signOutAction} />
          <main className="min-w-0 bg-gray-50 md:ml-56">{children}</main>
        </div>
      </NotificationProvider>
    </PresentationProvider>
  );
}
