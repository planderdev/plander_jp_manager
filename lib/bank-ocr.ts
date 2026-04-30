import 'server-only';

export type MonthlySettlementTransaction = {
  id: string;
  direction: 'incoming' | 'outgoing';
  amount: number;
  memo: string;
  rawText: string;
  happenedAt: string | null;
  sourceName: string;
};

export type MonthlySettlementOcrDocument = {
  sourceName: string;
  text: string;
  lines: string[];
};

function normalizeText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/[|¦]/g, ' ')
    .replace(/[＿_]{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeLines(lines: string[]) {
  return lines
    .map((line) => normalizeText(line))
    .filter(Boolean);
}

function isLikelyDateToken(token: string) {
  const digits = token.replace(/\D/g, '');
  if (digits.length === 8) {
    const year = Number(digits.slice(0, 4));
    const month = Number(digits.slice(4, 6));
    const day = Number(digits.slice(6, 8));
    if (year >= 2000 && year <= 2099 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return true;
    }
  }
  if (digits.length === 4) {
    const month = Number(digits.slice(0, 2));
    const day = Number(digits.slice(2, 4));
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return true;
    }
  }
  return false;
}

function extractAmount(text: string) {
  const matches = [...text.matchAll(/[+-]?\d[\d,]{2,}(?:원)?/g)];
  for (const match of matches) {
    const token = match[0];
    if (isLikelyDateToken(token)) continue;
    const digits = token.replace(/[^\d-]/g, '');
    const amount = Number(digits);
    if (!Number.isFinite(amount)) continue;
    if (Math.abs(amount) < 1000) continue;
    return Math.abs(amount);
  }
  return null;
}

function extractDate(text: string) {
  const full = text.match(/\b(20\d{2})[./-](\d{1,2})[./-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (full) {
    const [, year, month, day, hour = '00', minute = '00'] = full;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}`;
  }

  const short = text.match(/\b(\d{1,2})[./-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (short) {
    const [, month, day, hour = '00', minute = '00'] = short;
    return `${month.padStart(2, '0')}-${day.padStart(2, '0')} ${hour.padStart(2, '0')}:${minute}`;
  }

  return null;
}

function classifyDirection(text: string) {
  const normalized = text.toLowerCase();
  if (/[+-]\d[\d,]{2,}/.test(normalized)) {
    return normalized.includes('-') ? 'outgoing' : 'incoming';
  }

  const outgoingKeywords = ['출금', '보냄', '송금', '이체', '결제', 'withdraw', 'debit', 'payment', '출'];
  if (outgoingKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'outgoing';
  }

  const incomingKeywords = ['입금', '받음', '입', 'deposit', 'credit'];
  if (incomingKeywords.some((keyword) => normalized.includes(keyword))) {
    return 'incoming';
  }

  return 'outgoing';
}

function extractMemo(text: string) {
  const stripped = normalizeText(
    text
      .replace(/\b20\d{2}[./-]\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2})?\b/g, ' ')
      .replace(/\b\d{1,2}[./-]\d{1,2}(?:\s+\d{1,2}:\d{2})?\b/g, ' ')
      .replace(/[+-]?\d[\d,]{2,}(?:원)?/g, ' ')
      .replace(/\b(잔액|balance|krw|won)\b/gi, ' ')
  );

  return stripped || '메모 없음';
}

function collectCandidateLine(lines: string[], index: number) {
  const base = lines[index] ?? '';
  const prev = lines[index - 1] ?? '';
  const next = lines[index + 1] ?? '';
  return normalizeText([prev, base, next].filter(Boolean).join(' '));
}

function dedupeTransactions(items: MonthlySettlementTransaction[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = [
      item.direction,
      item.amount,
      item.memo.replace(/\s+/g, ''),
      item.happenedAt ?? '',
      item.sourceName,
    ].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function readBankScreenshot(file: File): Promise<MonthlySettlementOcrDocument> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker(['kor', 'eng'], 1, {});

  try {
    const image = Buffer.from(await file.arrayBuffer());
    const result = await worker.recognize(image);
    const rawData = result.data as { text?: string; lines?: Array<{ text?: string | null }> };
    const lines = normalizeLines((rawData.lines ?? []).map((line) => line.text ?? ''));
    const text = normalizeText(rawData.text ?? '');

    return {
      sourceName: file.name,
      text,
      lines: lines.length ? lines : text.split('\n').map((line) => normalizeText(line)).filter(Boolean),
    };
  } finally {
    await worker.terminate();
  }
}

export function parseTransactionsFromOcrDocuments(
  documents: MonthlySettlementOcrDocument[],
): MonthlySettlementTransaction[] {
  const transactions: MonthlySettlementTransaction[] = [];

  documents.forEach((document) => {
    document.lines.forEach((line, index) => {
      const candidate = collectCandidateLine(document.lines, index);
      const amount = extractAmount(candidate);
      if (!amount) return;

      const lowered = candidate.toLowerCase();
      if (lowered.includes('잔액') && !/(입금|출금|보냄|받음|송금|이체|deposit|withdraw|credit|debit)/i.test(candidate)) {
        return;
      }

      transactions.push({
        id: `${document.sourceName}-${index}-${amount}`,
        direction: classifyDirection(candidate),
        amount,
        memo: extractMemo(candidate),
        rawText: candidate,
        happenedAt: extractDate(candidate),
        sourceName: document.sourceName,
      });
    });
  });

  return dedupeTransactions(transactions).sort((a, b) => {
    if (a.sourceName !== b.sourceName) return a.sourceName.localeCompare(b.sourceName);
    return (a.happenedAt ?? '').localeCompare(b.happenedAt ?? '');
  });
}
