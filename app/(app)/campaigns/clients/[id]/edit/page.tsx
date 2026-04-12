import ClientForm from '@/components/ClientForm';
import { updateClientAction } from '@/actions/clients';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

export default async function EditClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: client } = await sb.from('clients').select('*').eq('id', Number(id)).single();
  if (!client) notFound();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">클라이언트 수정</h1>
      <ClientForm client={client} action={updateClientAction} />
    </div>
  );
}