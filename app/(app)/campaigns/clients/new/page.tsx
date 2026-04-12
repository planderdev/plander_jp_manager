import ClientForm from '@/components/ClientForm';
import { createClientAction } from '@/actions/clients';
import { getClientOptions } from '@/actions/client-options';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NewClientPage() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/login');

  const [options, { data: admins }] = await Promise.all([
    getClientOptions(),
    sb.from('admins').select('id, name').order('name'),
  ]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">클라이언트 신규 등록</h1>
      <ClientForm
        action={createClientAction}
        options={options}
        admins={admins ?? []}
        currentUserId={user.id}
      />
    </div>
  );
}