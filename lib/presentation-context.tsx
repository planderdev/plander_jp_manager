'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext<{ presenting: boolean; toggle: () => void }>({
  presenting: false,
  toggle: () => {},
});

export function PresentationProvider({ children }: { children: React.ReactNode }) {
  const [presenting, setPresenting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('presenting') === '1';
    setPresenting(saved);
  }, []);

  function toggle() {
    setPresenting((prev) => {
      const next = !prev;
      localStorage.setItem('presenting', next ? '1' : '0');
      return next;
    });
  }

  return <Ctx.Provider value={{ presenting, toggle }}>{children}</Ctx.Provider>;
}

export function usePresentation() {
  return useContext(Ctx);
}