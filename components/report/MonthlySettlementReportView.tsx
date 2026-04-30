import Logo from '@/components/Logo';
import type { MonthlySettlementReportData } from '@/lib/monthly-settlement-report';

function money(value: number) {
  return `${value.toLocaleString()}원`;
}

function statusLabel(status: 'payable' | 'done') {
  return status === 'done' ? '정산완료' : '정산예정';
}

function statusClass(status: 'payable' | 'done') {
  return status === 'done'
    ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-red-100 text-red-700 ring-1 ring-red-200';
}

export default function MonthlySettlementReportView({
  data,
}: {
  data: MonthlySettlementReportData;
}) {
  const clientLabel = data.clients.map((client) => client.company_name).join(' / ') || '-';

  return (
    <div className="rounded-[32px] bg-[linear-gradient(180deg,#f5f2ea_0%,#ffffff_42%,#f6f7fb_100%)] p-3 text-gray-900 md:p-6">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-6">
        <section className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-black px-3 py-1 text-[11px] font-semibold tracking-[0.24em] text-white">
              MONTHLY SETTLEMENT REPORT
            </span>
            <div className="flex items-center gap-3">
              <Logo className="h-5 w-auto text-black" />
              <div className="h-5 w-px bg-gray-300" />
              <p className="text-sm text-gray-500">대표 보고용 월말 결산 페이지입니다.</p>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-2xl font-bold md:text-4xl">{data.title}</h1>
                <p className="mt-2 text-sm text-gray-600 md:text-base">{clientLabel}</p>
              </div>
              {data.createdAtLabel ? (
                <span className="rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#3b4cca]">
                  {data.createdAtLabel} 기준
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 md:grid-cols-6">
          <SummaryCard label="총 입금" value={money(data.totals.incoming)} tone="blue" />
          <SummaryCard label="총 출금" value={money(data.totals.outgoing)} tone="red" />
          <SummaryCard label="순액" value={money(data.totals.net)} tone={data.totals.net >= 0 ? 'black' : 'red'} />
          <SummaryCard label="완료게시물" value={`${data.totals.completedPosts}건`} tone="black" />
          <SummaryCard label="정산완료 / 예정" value={`${data.totals.settledPosts} / ${data.totals.payablePosts}`} tone="green" />
          <SummaryCard label="실 송금 캡처" value={`${data.totals.transferProofCount}장`} tone="black" />
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">BANK ENTRIES</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">입출금 내역</h2>
            </div>
            <p className="text-sm text-gray-500">
              캡처 {data.bankScreenshotImageUrls.length.toLocaleString()}장 · 입력 {data.transactions.length.toLocaleString()}건
            </p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-3 md:hidden">
                {data.transactions.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{item.happenedAt ?? item.sourceName}</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{item.memo}</p>
                        <p className="mt-1 text-sm text-gray-500">{item.sourceName}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.direction === 'incoming' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-red-100 text-red-700 ring-1 ring-red-200'}`}>
                        {item.direction === 'incoming' ? '입금' : '출금'}
                      </span>
                    </div>
                    <p className="mt-4 text-xl font-bold text-gray-950">{money(item.amount)}</p>
                  </div>
                ))}
                {!data.transactions.length && (
                  <div className="rounded-[24px] border border-dashed border-gray-300 bg-[#fafaf8] p-8 text-center text-sm text-gray-400">
                    입력된 입출금 내역이 없습니다.
                  </div>
                )}
              </div>

              <div className="hidden overflow-hidden rounded-[24px] border border-gray-200 md:block">
                <table className="w-full text-sm">
                  <thead className="bg-[#f5f6fa] text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3">구분</th>
                      <th className="px-4 py-3">일시</th>
                      <th className="px-4 py-3">메모</th>
                      <th className="px-4 py-3">금액</th>
                      <th className="px-4 py-3">출처</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.transactions.map((item) => (
                      <tr key={item.id} className="border-t border-gray-100">
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.direction === 'incoming' ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-200' : 'bg-red-100 text-red-700 ring-1 ring-red-200'}`}>
                            {item.direction === 'incoming' ? '입금' : '출금'}
                          </span>
                        </td>
                        <td className="px-4 py-3">{item.happenedAt ?? '-'}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{item.memo}</td>
                        <td className="px-4 py-3 font-semibold">{money(item.amount)}</td>
                        <td className="px-4 py-3 text-gray-500">{item.sourceName}</td>
                      </tr>
                    ))}
                    {!data.transactions.length && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-gray-400">입력된 입출금 내역이 없습니다.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-3">
              {data.bankScreenshotImageUrls.length ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
                  {data.bankScreenshotImageUrls.map((item, index) => (
                    <a
                      key={item.path}
                      href={item.url}
                      target="_blank"
                      className="overflow-hidden rounded-[24px] border border-gray-200 bg-[#fafaf8] shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                    >
                      <img src={item.url} alt={`입출금 내역 캡처 ${index + 1}`} className="h-auto w-full object-cover" />
                      <div className="border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                        입출금 내역 캡처 {index + 1}
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="rounded-[24px] border border-dashed border-gray-300 bg-[#fafaf8] p-8 text-center text-sm text-gray-400">
                  등록된 입출금 내역 캡처가 없습니다.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">TRANSFER PROOFS</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">실 송금내역 캡처</h2>
            </div>
            <p className="text-sm text-gray-500">{data.transferProofImageUrls.length.toLocaleString()} images</p>
          </div>

          {data.transferProofImageUrls.length ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.transferProofImageUrls.map((item, index) => (
                <a
                  key={item.path}
                  href={item.url}
                  target="_blank"
                  className="overflow-hidden rounded-[24px] border border-gray-200 bg-[#fafaf8] shadow-[0_10px_30px_rgba(15,23,42,0.04)]"
                >
                  <img src={item.url} alt={`실 송금내역 캡처 ${index + 1}`} className="h-auto w-full object-cover" />
                  <div className="border-t border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                    실 송금내역 캡처 {index + 1}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-gray-300 bg-[#fafaf8] p-8 text-center text-sm text-gray-400">
              등록된 실 송금내역 캡처가 없습니다.
            </div>
          )}
        </section>

        <section className="rounded-[28px] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-7">
          <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">COMPLETED POSTS</p>
              <h2 className="mt-2 text-xl font-bold md:text-2xl">완료게시물 목록</h2>
            </div>
            <p className="text-sm text-gray-500">{data.completedPosts.length.toLocaleString()} records</p>
          </div>

          <div className="space-y-3 md:hidden">
            {data.completedPosts.map((item) => (
              <div key={item.id} className="rounded-[24px] border border-gray-200 bg-[#fafaf8] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-gray-400">{item.visitDate}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">{item.storeName}</p>
                    <a href={item.accountUrl ?? '#'} target="_blank" className="mt-1 block text-lg font-semibold text-black underline-offset-4 hover:underline">
                      @{item.influencerHandle}
                    </a>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.settlementStatus)}`}>
                    {statusLabel(item.settlementStatus)}
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <MetricChip label="조회수" value={item.views} />
                  <MetricChip label="좋아요" value={item.likes} />
                  <MetricChip label="댓글" value={item.comments} />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {item.postUrl ? (
                    <a href={item.postUrl} target="_blank" className="inline-flex rounded-full border border-gray-900 px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white">
                      게시물 바로가기
                    </a>
                  ) : (
                    <span className="inline-flex rounded-full border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-500">
                      업로드 전
                    </span>
                  )}
                  <span className="text-sm font-semibold text-gray-800">{money(item.settlementAmount)}</span>
                </div>
              </div>
            ))}
            {!data.completedPosts.length && (
              <div className="rounded-[24px] border border-dashed border-gray-300 bg-[#fafaf8] p-8 text-center text-sm text-gray-400">
                해당 월의 완료게시물이 없습니다.
              </div>
            )}
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-gray-200 md:block">
            <table className="w-full text-sm">
              <thead className="bg-[#f5f6fa] text-left text-gray-600">
                <tr>
                  <th className="px-4 py-3">방문일</th>
                  <th className="px-4 py-3">가게명</th>
                  <th className="px-4 py-3">인플루언서</th>
                  <th className="px-4 py-3">게시물</th>
                  <th className="px-4 py-3">조회수</th>
                  <th className="px-4 py-3">좋아요</th>
                  <th className="px-4 py-3">댓글</th>
                  <th className="px-4 py-3">정산금액</th>
                  <th className="px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {data.completedPosts.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">{item.visitDate}</td>
                    <td className="px-4 py-3">{item.storeName}</td>
                    <td className="px-4 py-3">
                      <a href={item.accountUrl ?? '#'} target="_blank" className="font-medium text-blue-700 hover:underline">
                        @{item.influencerHandle}
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {item.postUrl ? (
                        <a href={item.postUrl} target="_blank" className="text-blue-700 hover:underline">링크</a>
                      ) : (
                        <span className="text-gray-400">업로드 전</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{item.views.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.likes.toLocaleString()}</td>
                    <td className="px-4 py-3">{item.comments.toLocaleString()}</td>
                    <td className="px-4 py-3 font-semibold">{money(item.settlementAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(item.settlementStatus)}`}>
                        {statusLabel(item.settlementStatus)}
                      </span>
                    </td>
                  </tr>
                ))}
                {!data.completedPosts.length && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-gray-400">해당 월의 완료게시물이 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'blue' | 'red' | 'black' | 'green';
}) {
  const toneClass = {
    blue: 'bg-blue-50 text-blue-700',
    red: 'bg-red-50 text-red-700',
    black: 'bg-black text-white',
    green: 'bg-emerald-50 text-emerald-700',
  }[tone];

  return (
    <div className={`rounded-[22px] p-4 shadow-[0_10px_30px_rgba(15,23,42,0.04)] ${toneClass}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">{label}</p>
      <p className="mt-3 text-xl font-bold md:text-2xl">{value}</p>
    </div>
  );
}

function MetricChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-3 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-gray-900">{value.toLocaleString()}</p>
    </div>
  );
}
