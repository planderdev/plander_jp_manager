'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

export default function Sidebar({
  userName, signOutAction,
}: { userName: string; signOutAction: () => void }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // 페이지 이동하면 자동으로 모바일 메뉴 닫기
  const close = () => setOpen(false);

  return (
    <>
      {/* 모바일 상단바 */}
      <header className="md:hidden bg-black text-white flex items-center justify-between px-4 h-14 sticky top-0 z-30">
        <div className="w-8" />
        <Logo className="h-4 w-auto text-white" />
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기" className="text-2xl w-8 text-right">☰</button>
      </header>

      {/* 어두운 배경 (모바일에서 메뉴 열렸을 때) */}
      {open && (
        <div onClick={close}
          className="md:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* 사이드바 본체 */}
      <aside className={`
        bg-black text-white p-4 flex flex-col
        fixed md:sticky top-0 left-0 h-screen w-64 z-50
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:w-56
      `}>
        <div className="flex items-center justify-between mb-6">
          <div className="mb-6">
            <Logo className="h-4 w-auto text-white" />
          </div>
          <button onClick={close} className="md:hidden text-2xl" aria-label="닫기">✕</button>
        </div>

        <nav className="space-y-1 text-sm flex-1 overflow-y-auto">
          <NavLink href="/dashboard" pathname={pathname} onClick={close}>대시보드</NavLink>
          <Section>영업</Section>
          <NavLink href="/sales" pathname={pathname} onClick={close}>영업 관리</NavLink>
          <Section>캠페인</Section>
          <NavLink href="/campaigns/clients" pathname={pathname} onClick={close}>클라이언트 정보</NavLink>
          <NavLink href="/campaigns/schedules" pathname={pathname} onClick={close}>스케줄 관리</NavLink>
          <Section>인플루언서</Section>
          <NavLink href="/influencers" pathname={pathname} onClick={close}>인플루언서 목록</NavLink>
          <NavLink href="/influencers/posts" pathname={pathname} onClick={close}>게시물/정산관리</NavLink>
          <NavLink href="/campaigns/completed" pathname={pathname} onClick={close}>완료 게시물</NavLink>
          <Section>부가기능</Section>
          <NavLink href="/extras/stats" pathname={pathname} onClick={close}>리포트</NavLink>
          <NavLink href="/extras/reports" pathname={pathname} onClick={close}>보고서 추출</NavLink>
        </nav>

        <div className="border-t border-gray-700 pt-3 mt-3 text-xs">
          <div className="px-3 mb-2">{userName}</div>
          <NavLink href="/extras/admins" pathname={pathname} onClick={close}>관리자</NavLink>
          <form action={signOutAction}>
            <button className="w-full text-left px-3 py-2 rounded hover:bg-gray-800">로그아웃</button>
          </form>
        </div>
      </aside>
    </>
  );
}

function NavLink({ href, pathname, onClick, children }: any) {
  // 정확히 일치할 때만 active. 단, 상세 페이지(/[id], /new)는 부모 메뉴를 active로.
  const active =
    pathname === href ||
    (href !== '/' && pathname?.startsWith(href + '/') &&
     // /influencers가 /influencers/posts를 먹지 않도록 예외
     !(href === '/influencers' && pathname.startsWith('/influencers/posts')));
  return (
    <Link href={href} onClick={onClick}
      className={`block px-3 py-2 rounded ${active ? 'bg-gray-700' : 'hover:bg-gray-800'}`}>
      {children}
    </Link>
  );
}
function Section({ children }: { children: React.ReactNode }) {
  return <div className="pt-3 text-xs text-gray-400 px-3">{children}</div>;
}