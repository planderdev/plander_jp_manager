'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
      <header className="md:hidden bg-gray-900 text-white flex items-center justify-between px-4 h-14 sticky top-0 z-30">
        <div className="font-bold">
          <?xml version="1.0" encoding="UTF-8"?>
            <svg id="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70.37 12.81">
              <defs>
                <style>
                  .cls-1 {
                    fill: #fff;
                  }
                </style>
              </defs>
              <path class="cls-1" d="M9.19,3.83C9.19,1.95,7.9.05,4.98,0L0,.02v12.64h2.58v-4.92c.74-.02,1.61-.02,2.52-.08,2.01-.17,4.09-1.49,4.09-3.83ZM5.03,5.36c-.77.09-1.63.12-2.44.12v-3.24c.89,0,1.74.03,2.51.14,1.08.14,1.45.58,1.45,1.49,0,.85-.57,1.37-1.51,1.49Z"/>
              <path class="cls-1" d="M27.1,4.18c-.94-.38-2.26-.52-3.17-.51-.22,0-.4.02-.57.03-2.23.18-3.9,2.2-3.9,4.53s1.66,4.35,3.9,4.53c1.25.09,2.15-.32,2.84-.98v.86h2.47V4.35c-.31-.09-.65-.17-1-.23-.12-.02-.32.02-.58.06ZM26.24,8.29c-.02,1.37-.86,2.28-2.09,2.28s-2.11-.92-2.11-2.32.89-2.32,2.11-2.32c1.2.02,2.09.92,2.09,2.32v.05Z"/>
              <path class="cls-1" d="M34.26,3.67c-.86,0-1.57.23-2.14.6v-.52h-2.15v8.9h2.55v-4.24c0-.29,0-.57.03-.81.08-1.15.68-1.74,1.71-1.74,1.18,0,1.74.71,1.74,2.2l.02,4.6h2.47l-.02-4.98c.02-2.46-1.58-4.01-4.21-4Z"/>
              <g>
                <path class="cls-1" d="M46.21,6.06c-.92,0-1.6.7-1.6,1.76s.64,1.76,1.6,1.76c.83,0,1.45-.55,1.57-1.41v-.68c-.13-.87-.75-1.42-1.57-1.43Z"/>
                <path class="cls-1" d="M52.21.04h-11.88c-.2,0-.37.16-.37.37v11.88c0,.2.16.37.37.37h11.88c.2,0,.37-.16.37-.37V.4c0-.2-.16-.37-.37-.37ZM49.66,11.17h-1.21c0-.08,0-.48-.05-.61-.52.38-1.21.66-2.13.71-.2,0-.41,0-.63-.01-1.63-.1-2.86-1.53-2.96-3.21-.01-.19-.01-.37.01-.56.13-1.54,1.26-2.85,2.75-3.07.23-.05.55-.07.89-.07.48,0,.99.1,1.46.29V1.13s1.88,0,1.88,0v10.04Z"/>
              </g>
              <path class="cls-1" d="M58.06,3.67c-2.26,0-4.4,1.84-4.4,4.57s2.29,4.57,4.57,4.57,3.57-1.32,4.07-2.49l-2.06-.46c-.45.6-1.25.92-2.03.85-1-.09-1.84-.78-2-1.75h6.24c0-3.26-1.54-5.27-4.4-5.27ZM56.26,7.26c.15-.92.81-1.64,1.84-1.64,1.09,0,1.83.85,1.91,1.64h-3.75Z"/>
              <path class="cls-1" d="M69.27,3.69c-.22-.02-.46-.03-.74-.03-1.05.05-2.04.65-2.37,1.18v-1.06h-2.49v8.87h2.49v-4.6c0-.68.32-1.83,1.54-2,.55-.09,1.05-.02,1.48.06.22.03.4.06.55.06l.65-2.24c-.15,0-.52-.15-1.11-.25Z"/>
              <path class="cls-1" d="M18.21,2.2l-5.85,7.47-2.5-2.64-1.71,1.62,3.44,3.64c.22.24.53.37.85.37.02,0,.04,0,.05,0,.34-.02.66-.18.87-.45l7.83-10h-2.99Z"/>
            </svg>
        </div>
        <button onClick={() => setOpen(true)} aria-label="메뉴 열기" className="text-2xl">☰</button>
      </header>

      {/* 어두운 배경 (모바일에서 메뉴 열렸을 때) */}
      {open && (
        <div onClick={close}
          className="md:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* 사이드바 본체 */}
      <aside className={`
        bg-gray-900 text-white p-4 flex flex-col
        fixed md:sticky top-0 left-0 h-screen w-64 z-50
        transform transition-transform duration-200
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:w-56
      `}>
        <div className="flex items-center justify-between mb-6">
          <div className="text-xl font-bold">
            <?xml version="1.0" encoding="UTF-8"?>
            <svg id="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70.37 12.81">
              <defs>
                <style>
                  .cls-1 {
                    fill: #fff;
                  }
                </style>
              </defs>
              <path class="cls-1" d="M9.19,3.83C9.19,1.95,7.9.05,4.98,0L0,.02v12.64h2.58v-4.92c.74-.02,1.61-.02,2.52-.08,2.01-.17,4.09-1.49,4.09-3.83ZM5.03,5.36c-.77.09-1.63.12-2.44.12v-3.24c.89,0,1.74.03,2.51.14,1.08.14,1.45.58,1.45,1.49,0,.85-.57,1.37-1.51,1.49Z"/>
              <path class="cls-1" d="M27.1,4.18c-.94-.38-2.26-.52-3.17-.51-.22,0-.4.02-.57.03-2.23.18-3.9,2.2-3.9,4.53s1.66,4.35,3.9,4.53c1.25.09,2.15-.32,2.84-.98v.86h2.47V4.35c-.31-.09-.65-.17-1-.23-.12-.02-.32.02-.58.06ZM26.24,8.29c-.02,1.37-.86,2.28-2.09,2.28s-2.11-.92-2.11-2.32.89-2.32,2.11-2.32c1.2.02,2.09.92,2.09,2.32v.05Z"/>
              <path class="cls-1" d="M34.26,3.67c-.86,0-1.57.23-2.14.6v-.52h-2.15v8.9h2.55v-4.24c0-.29,0-.57.03-.81.08-1.15.68-1.74,1.71-1.74,1.18,0,1.74.71,1.74,2.2l.02,4.6h2.47l-.02-4.98c.02-2.46-1.58-4.01-4.21-4Z"/>
              <g>
                <path class="cls-1" d="M46.21,6.06c-.92,0-1.6.7-1.6,1.76s.64,1.76,1.6,1.76c.83,0,1.45-.55,1.57-1.41v-.68c-.13-.87-.75-1.42-1.57-1.43Z"/>
                <path class="cls-1" d="M52.21.04h-11.88c-.2,0-.37.16-.37.37v11.88c0,.2.16.37.37.37h11.88c.2,0,.37-.16.37-.37V.4c0-.2-.16-.37-.37-.37ZM49.66,11.17h-1.21c0-.08,0-.48-.05-.61-.52.38-1.21.66-2.13.71-.2,0-.41,0-.63-.01-1.63-.1-2.86-1.53-2.96-3.21-.01-.19-.01-.37.01-.56.13-1.54,1.26-2.85,2.75-3.07.23-.05.55-.07.89-.07.48,0,.99.1,1.46.29V1.13s1.88,0,1.88,0v10.04Z"/>
              </g>
              <path class="cls-1" d="M58.06,3.67c-2.26,0-4.4,1.84-4.4,4.57s2.29,4.57,4.57,4.57,3.57-1.32,4.07-2.49l-2.06-.46c-.45.6-1.25.92-2.03.85-1-.09-1.84-.78-2-1.75h6.24c0-3.26-1.54-5.27-4.4-5.27ZM56.26,7.26c.15-.92.81-1.64,1.84-1.64,1.09,0,1.83.85,1.91,1.64h-3.75Z"/>
              <path class="cls-1" d="M69.27,3.69c-.22-.02-.46-.03-.74-.03-1.05.05-2.04.65-2.37,1.18v-1.06h-2.49v8.87h2.49v-4.6c0-.68.32-1.83,1.54-2,.55-.09,1.05-.02,1.48.06.22.03.4.06.55.06l.65-2.24c-.15,0-.52-.15-1.11-.25Z"/>
              <path class="cls-1" d="M18.21,2.2l-5.85,7.47-2.5-2.64-1.71,1.62,3.44,3.64c.22.24.53.37.85.37.02,0,.04,0,.05,0,.34-.02.66-.18.87-.45l7.83-10h-2.99Z"/>
            </svg>
          </div>
          <button onClick={close} className="md:hidden text-2xl" aria-label="닫기">✕</button>
        </div>

        <nav className="space-y-1 text-sm flex-1 overflow-y-auto">
          <NavLink href="/dashboard" pathname={pathname} onClick={close}>대시보드</NavLink>
          <Section>캠페인</Section>
          <NavLink href="/campaigns/clients" pathname={pathname} onClick={close}>클라이언트 정보</NavLink>
          <NavLink href="/campaigns/schedules" pathname={pathname} onClick={close}>스케줄 관리</NavLink>
          <NavLink href="/campaigns/completed" pathname={pathname} onClick={close}>완료 게시물</NavLink>
          <NavLink href="/campaigns/insights" pathname={pathname} onClick={close}>인사이트</NavLink>
          <Section>인플루언서</Section>
          <NavLink href="/influencers" pathname={pathname} onClick={close}>인플루언서 목록</NavLink>
          <NavLink href="/influencers/posts" pathname={pathname} onClick={close}>게시물/정산관리</NavLink>
          <Section>부가기능</Section>
          <NavLink href="/extras/stats" pathname={pathname} onClick={close}>리포트</NavLink>
          <NavLink href="/extras/reports" pathname={pathname} onClick={close}>보고서 추출</NavLink>
          <NavLink href="/extras/admins" pathname={pathname} onClick={close}>관리자</NavLink>
        </nav>

        <div className="border-t border-gray-700 pt-3 mt-3 text-xs">
          <div className="px-3 mb-2">{userName}</div>
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