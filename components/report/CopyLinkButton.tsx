'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n/provider';

export default function CopyLinkButton({ token, basePath = '/report' }: { token: string; basePath?: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}${basePath}/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button type="button" onClick={handleCopy} className="text-blue-600 hover:underline">
      {copied ? t('reports.copied') : t('reports.copyLink')}
    </button>
  );
}
