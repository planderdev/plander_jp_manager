import ClientForm from '@/components/ClientForm';
import { createClientAction } from '@/actions/clients';

export default function NewClientPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">클라이언트 신규 등록</h1>
      <ClientForm action={createClientAction} />
    </div>
  );
}